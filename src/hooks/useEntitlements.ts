'use client';

import { useApi } from './useApi';
import type { Entitlements } from '@/lib/learn-types';

/**
 * Quyền của người dùng theo gói đang dùng.
 *
 * Đây CHỈ là lớp trải nghiệm — nó quyết định hiện nút "Bắt đầu thi" hay nút
 * "Mở khoá". Chốt chặn thật nằm ở máy chủ (generateExam kiểm tra quyền, và
 * /srs/review kiểm tra hạn mức), nên sửa giá trị trong trình duyệt không mở
 * khoá được gì cả.
 *
 * Mặc định khi chưa tải xong là KHÔNG có quyền, không phải có quyền: nhấp nháy
 * cho thấy nút thi rồi ẩn đi ngay sau đó là trải nghiệm khó chịu hơn nhiều so
 * với việc nút xuất hiện muộn nửa giây.
 */
export function useEntitlements() {
  const { data, isLoading, error, reload } = useApi<Entitlements>('/billing/entitlements');

  return {
    entitlements: data,
    isLoading,
    error,
    reload,
    isPremium: data?.isPremium ?? false,
    canTakeMockExam: data?.canTakeMockExam ?? false,
    reviewsRemaining: data?.reviews.remaining ?? null,
    reviewLimit: data?.reviews.limit ?? null,
  };
}
