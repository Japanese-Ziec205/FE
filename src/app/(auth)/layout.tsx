import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-washi">
      <header className="border-b border-[#E8E2D9]">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🌸</span>
            <span className="text-lg font-bold text-sumi">Nihongo Kizuna</span>
          </Link>
        </div>
      </header>

      <main id="noi-dung-chinh" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </main>

      <footer className="py-6 text-center text-sm text-sumi-muted">
        Dự án phi lợi nhuận · Miễn phí cho mọi người
      </footer>
    </div>
  );
}
