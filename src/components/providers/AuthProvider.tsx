'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Chạy bootstrap() một lần khi ứng dụng khởi động.
 *
 * Access token chỉ nằm trong RAM (không lưu localStorage để chống XSS),
 * nên mỗi lần tải lại trang phải hỏi server bằng cookie httpOnly `rt`
 * để lấy token mới. Không có bước này thì người dùng bị đăng xuất
 * mỗi khi F5.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
