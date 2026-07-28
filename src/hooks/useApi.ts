'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiException } from '@/lib/api-client';

interface QueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/** Kết quả kèm khoá của request đã sinh ra nó, để biết nó còn khớp hay đã cũ. */
interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Tải dữ liệu từ API cho một trang.
 *
 * Dự án cố ý không dùng React Query hay SWR: nhu cầu hiện tại chỉ là "gọi một
 * lần khi mở trang, cho phép tải lại". Thêm một thư viện 13KB cho việc đó là
 * không xứng đáng với người học đang dùng mạng tính theo dung lượng.
 *
 * Truyền `null` khi chưa đủ điều kiện để gọi. `path` phải ổn định giữa các lần
 * render (chuỗi hằng hoặc đã memo) vì nó là phụ thuộc của effect.
 */
export function useApi<T>(path: string | null): QueryState<T> & { reload: () => void } {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  // Tăng lên mỗi lần gọi reload() để sinh khoá mới, buộc effect chạy lại
  const [nonce, setNonce] = useState(0);
  const requestKey = path === null ? null : `${nonce}:${path}`;

  useEffect(() => {
    if (path === null || requestKey === null) return;

    /**
     * Bỏ qua phản hồi của request đã cũ.
     *
     * Người dùng bấm đổi tab nhanh có thể tạo hai request chồng nhau; nếu cái
     * đầu về sau thì kết quả cũ sẽ ghi đè kết quả mới. Cờ này chặn đúng chỗ đó,
     * đồng thời tránh setState sau khi component đã bị gỡ.
     */
    let stale = false;

    api
      .get<T>(path)
      .then((data) => {
        if (!stale) setSettled({ key: requestKey, data, error: null });
      })
      .catch((err: unknown) => {
        if (stale) return;
        setSettled({
          key: requestKey,
          data: null,
          error:
            err instanceof ApiException ? err.message : 'Không tải được dữ liệu. Vui lòng thử lại.',
        });
      });

    return () => {
      stale = true;
    };
  }, [path, requestKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /**
   * Trạng thái được suy ra lúc render chứ không gán bằng setState trong effect.
   *
   * Chừng nào kết quả đang giữ chưa mang đúng khoá của request hiện tại thì
   * nghĩa là đang tải. Cách này vừa bỏ được một vòng render thừa, vừa xử lý
   * đúng trường hợp `path` đổi giữa chừng: dữ liệu cũ không bị hiển thị nhầm
   * dưới địa chỉ mới.
   */
  if (requestKey === null) {
    return { data: null, error: null, isLoading: false, reload };
  }

  const isCurrent = settled?.key === requestKey;
  return {
    data: isCurrent ? settled.data : null,
    error: isCurrent ? settled.error : null,
    isLoading: !isCurrent,
    reload,
  };
}

/**
 * Gọi một hành động thay đổi dữ liệu (POST/PATCH), kèm cờ đang chạy và lỗi.
 *
 * Tách riêng khỏi useApi vì hành động do người dùng kích hoạt chứ không chạy
 * lúc mở trang, và cần biết lúc nào nút phải khoá lại.
 */
export function useAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const [isRunning, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Giữ hàm ở ref để `run` không đổi danh tính mỗi lần render — nếu không, mọi
  // component nhận `run` qua props sẽ render lại vô ích.
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(async (...args: TArgs): Promise<TResult | null> => {
    setRunning(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : 'Không thực hiện được. Vui lòng thử lại.',
      );
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  return { run, isRunning, error, clearError: useCallback(() => setError(null), []) };
}
