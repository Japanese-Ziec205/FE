import type { ApiError, FieldIssue } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export class ApiException extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }

  /** Lỗi validate trả về danh sách từng trường — dùng để gắn vào form. */
  get fieldIssues(): FieldIssue[] {
    return Array.isArray(this.details) ? (this.details as FieldIssue[]) : [];
  }

  get isNetworkError() {
    return this.code === 'NETWORK_ERROR';
  }
}

// ---------------------------------------------------------------------------
// Access token giữ trong bộ nhớ, KHÔNG lưu localStorage.
// localStorage đọc được bằng JavaScript nên một lỗ hổng XSS là đủ để lấy token.
// Đổi lại, tải lại trang sẽ mất token — nên có bootstrapAuth() gọi /auth/refresh
// để lấy lại từ cookie httpOnly.
// ---------------------------------------------------------------------------
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// Nhiều request cùng hết hạn một lúc thì chỉ gọi refresh MỘT lần,
// các request còn lại chờ chung promise đó.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // để trình duyệt gửi kèm cookie `rt`
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const json = await res.json();
      accessToken = json?.data?.accessToken ?? null;
      return accessToken !== null;
    } catch {
      return false;
    } finally {
      // Nhả khoá ở tick sau để các request đang chờ kịp đọc kết quả
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Bỏ qua cơ chế tự refresh — dùng cho chính endpoint refresh/login. */
  skipAuthRetry?: boolean;
  /**
   * Trả về NGUYÊN phong bì `{ success, data, meta }` thay vì chỉ `data`.
   * Cần cho các endpoint phân trang, vì `meta` nằm ngang hàng với `data`.
   */
  withEnvelope?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Mặc định chỉ trả về `data` trong phong bì `{ success, data }` — đó là dạng
 * của gần như mọi endpoint. Riêng các endpoint phân trang còn kèm `meta` nằm
 * NGANG HÀNG với `data`; dùng `api.getPaged` cho chúng để không mất số trang.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, withEnvelope, headers, ...rest } = options;

  const doFetch = async (): Promise<Response> =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    // Render gói miễn phí ngủ sau 15 phút — lần gọi đầu có thể timeout.
    // Thông báo phải nói rõ điều đó thay vì "Lỗi mạng" chung chung.
    throw new ApiException(0, {
      code: 'NETWORK_ERROR',
      message:
        'Không kết nối được máy chủ. Máy chủ có thể đang khởi động, vui lòng thử lại sau khoảng 30 giây.',
      details: null,
    });
  }

  // Access token hết hạn → thử refresh một lần rồi gọi lại
  if (res.status === 401 && !skipAuthRetry) {
    const json = await res.clone().json().catch(() => null);
    const code = json?.error?.code;

    if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_MISSING') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await doFetch();
      } else {
        accessToken = null;
        onUnauthorized?.();
      }
    } else if (code === 'AUTH_SESSION_COMPROMISED' || code === 'AUTH_TOKEN_REVOKED') {
      accessToken = null;
      onUnauthorized?.();
    }
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiException(
      res.status,
      json?.error ?? {
        code: 'UNKNOWN_ERROR',
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        details: null,
      },
    );
  }

  return (withEnvelope ? json : json.data) as T;
}

export interface Paged<T> {
  data: T[];
  meta: PaginationMeta;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  /** Dùng cho endpoint phân trang: giữ lại `meta` mà `get` sẽ vứt đi. */
  getPaged: <T>(path: string) =>
    request<Paged<T>>(path, { method: 'GET', withEnvelope: true }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  refresh: refreshAccessToken,
};
