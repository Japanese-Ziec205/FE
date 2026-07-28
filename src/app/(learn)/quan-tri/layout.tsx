'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Database, LayoutDashboard, ShieldAlert } from 'lucide-react';

import { useAuthStore } from '@/lib/auth-store';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/quan-tri', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/quan-tri/noi-dung', label: 'Kho nội dung', icon: Database },
  { href: '/quan-tri/duyet', label: 'Hàng chờ duyệt', icon: ClipboardCheck },
];

/** Ba vai trò được vào khu quản trị; học viên thì không. */
const ALLOWED = new Set(['admin', 'lecturer', 'contributor']);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  /**
   * Chặn ở giao diện chỉ để người dùng không lạc vào trang trắng.
   *
   * Đây KHÔNG phải lớp bảo mật: mọi endpoint quản trị đều tự kiểm tra quyền ở
   * backend, nên sửa biến trong trình duyệt cũng không đọc được gì thêm.
   */
  if (user && !ALLOWED.has(user.role)) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-yamabuki-600" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-sumi">Khu vực dành cho ban biên soạn</h1>
        <p className="mt-2 text-sumi-muted">
          Tài khoản của bạn là học viên nên không vào được phần này. Nếu bạn muốn tham gia
          biên soạn nội dung cho dự án, hãy liên hệ với quản trị viên.
        </p>
        <Link href="/bang-dieu-khien" className="mt-5 inline-block font-semibold text-sakura-600">
          Về trang chính
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-sumi">Quản trị nội dung</h1>
        <p className="mt-1 text-sumi-muted">
          Sửa đổi kho ngôn ngữ và đề thi trực tiếp tại đây — không cần triển khai lại hệ thống.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Khu quản trị">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'tap-target inline-flex items-center gap-2 rounded-xl px-4 text-sm font-semibold transition',
                active
                  ? 'bg-ai-500 text-white shadow-sm'
                  : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-black/[0.03]',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
