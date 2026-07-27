import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const fontSans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

/**
 * Noto Sans JP đầy đủ rất nặng (~4MB). Chỉ tải hai độ đậm cần dùng,
 * và `display: swap` để chữ hiện ngay bằng font hệ thống trong lúc chờ tải.
 */
const fontJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jp',
  display: 'swap',
  preload: false,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Nihongo Kizuna — Học tiếng Nhật miễn phí cho mọi người',
    template: '%s · Nihongo Kizuna',
  },
  description:
    'Nền tảng học tiếng Nhật trực tuyến phi lợi nhuận, miễn phí hoàn toàn. Lộ trình N5 đến N1 bám sát khung JLPT, có bảng chữ cái, luyện viết, đọc hiểu và thi thử.',
  keywords: ['học tiếng Nhật', 'JLPT', 'N5', 'Hiragana', 'Katakana', 'Kanji', 'miễn phí'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: 'Nihongo Kizuna',
    title: 'Nihongo Kizuna — Học tiếng Nhật miễn phí cho mọi người',
    description:
      'Nền tảng học tiếng Nhật phi lợi nhuận, miễn phí hoàn toàn. Lộ trình N5 → N1 bám sát khung JLPT.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#F2637E',
  width: 'device-width',
  initialScale: 1,
  // Không đặt maximumScale: người dùng phải phóng to được tới 200%
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontJp.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <a
          href="#noi-dung-chinh"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-sakura-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Bỏ qua, tới nội dung chính
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
