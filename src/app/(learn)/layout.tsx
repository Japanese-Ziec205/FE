'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, ClipboardList, Home, LogOut, RefreshCw, Settings, Sparkles, Trophy, User } from 'lucide-react';

import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/bang-dieu-khien', label: 'Trang chính', icon: Home },
  { href: '/hoc', label: 'Học bài', icon: BookOpen },
  { href: '/on-tap', label: 'Ôn tập', icon: RefreshCw },
  { href: '/thi-thu', label: 'Thi thử', icon: ClipboardList },
  { href: '/thanh-tich', label: 'Thành tích', icon: Trophy },
  { href: '/ho-so', label: 'Hồ sơ', icon: User },
];

/**
 * Gói học không nằm trong thanh điều hướng chính.
 *
 * Đây là dự án phi lợi nhuận phục vụ người học khó khăn — nhét lời mời trả tiền
 * vào thanh điều hướng mà họ nhìn thấy mỗi lần mở trang là sai tinh thần. Người
 * cần nâng gói sẽ tới đây từ đúng chỗ họ chạm giới hạn (thi thử, hết lượt ôn).
 */
const PLANS_LINK = { href: '/goi-hoc', label: 'Gói học', icon: Sparkles };

/** Chỉ ban biên soạn thấy mục này; học viên thì không. */
const ADMIN_NAV = { href: '/quan-tri', label: 'Quản trị', icon: Settings };
const ADMIN_ROLES = new Set(['admin', 'lecturer', 'contributor']);

export default function LearnLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, onboardingCompleted, logout } = useAuthStore();

  // Bảo vệ phía client. Đây chỉ là lớp trải nghiệm — mọi kiểm tra thật nằm ở backend.
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/dang-nhap');
    // Chốt chặn đặt ở layout chứ không ở từng trang: chỉ cần sót một trang là
    // người dùng lọt vào hệ thống mà chưa có cấp độ, và mọi thứ phía sau —
    // hàng ôn tập, đề thi, bảng xếp hạng — đều không biết phục vụ cấp nào.
    else if (!onboardingCompleted) router.replace('/chon-cap-do');
  }, [isLoading, isAuthenticated, onboardingCompleted, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washi">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sakura-200 border-t-sakura-500" />
          <p className="mt-4 text-sumi-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !onboardingCompleted) return null;

  const nav = ADMIN_ROLES.has(user.role) ? [...NAV, ADMIN_NAV] : NAV;

  const handleLogout = async () => {
    await logout();
    router.replace('/dang-nhap');
  };

  return (
    <div className="min-h-screen bg-washi pb-20 md:pb-0">
      {/* ---------- Thanh trên ---------- */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D9] bg-washi/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/bang-dieu-khien" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🌸</span>
            <span className="hidden text-lg font-bold text-sumi sm:inline">Nihongo Kizuna</span>
          </Link>

          {/* Điều hướng desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'tap-target inline-flex items-center gap-2 rounded-xl px-3 text-sm font-medium transition',
                    active ? 'bg-sakura-50 text-sakura-700' : 'text-sumi-muted hover:bg-black/5',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={PLANS_LINK.href}
              className="tap-target hidden items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-sumi-muted hover:bg-black/5 sm:inline-flex"
            >
              <PLANS_LINK.icon className="h-4 w-4" aria-hidden="true" />
              {PLANS_LINK.label}
            </Link>
            <span className="hidden text-sm font-medium text-sumi sm:inline">
              {user.displayName}
            </span>
            <button
              onClick={handleLogout}
              aria-label="Đăng xuất"
              className="tap-target inline-flex items-center justify-center rounded-xl px-3 text-sumi-muted hover:bg-black/5"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="noi-dung-chinh" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>

      {/* ---------- Thanh tab dưới (mobile) ---------- */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8E2D9] bg-white md:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition',
                    active ? 'text-sakura-600' : 'text-sumi-muted',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
