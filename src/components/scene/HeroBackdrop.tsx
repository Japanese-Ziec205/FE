'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSceneCapability } from '@/hooks/useSceneCapability';

/**
 * Toàn bộ Three.js được nạp động và tắt render phía server.
 *
 * Ba thư viện three + @react-three/fiber + drei cộng lại khoảng 900KB. Nếu để
 * chúng nằm trong bundle ban đầu thì người dùng máy yếu phải tải hết trước khi
 * nhìn thấy chữ đầu tiên — trong khi phần lớn họ sẽ nhận bản ảnh tĩnh.
 */
const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => <StaticBackdrop />,
});

function StaticBackdrop() {
  return (
    <Image
      src="/scene/hero-fallback.png"
      alt=""
      fill
      priority
      sizes="100vw"
      className="object-cover object-bottom"
      // Ảnh trang trí thuần tuý — trình đọc màn hình nên bỏ qua
      aria-hidden="true"
    />
  );
}

export function HeroBackdrop({ dataSaver = false }: { dataSaver?: boolean }) {
  const mode = useSceneCapability(dataSaver);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {mode === 'static' ? <StaticBackdrop /> : <HeroScene animated={mode === 'full'} />}

      {/* Lớp phủ chuyển dần để chữ phía trên luôn đủ tương phản, dù nền là gì */}
      <div className="absolute inset-0 bg-gradient-to-b from-washi via-washi/55 to-washi/85 dark:from-[#141821] dark:via-[#141821]/60 dark:to-[#141821]/90" />
    </div>
  );
}
