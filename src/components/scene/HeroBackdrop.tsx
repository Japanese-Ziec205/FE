'use client';

import { Component, type ReactNode } from 'react';
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

/**
 * Nếu WebGL sập lúc chạy (driver lỗi, hết bộ nhớ GPU, trình duyệt chặn) thì
 * React sẽ gỡ bỏ cả cây component và người dùng nhìn thấy khoảng trắng.
 * Bắt lỗi ở đây để lùi về ảnh tĩnh — dò năng lực thiết bị trước không thể
 * lường hết mọi trường hợp hỏng.
 */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? <StaticBackdrop /> : this.props.children;
  }
}

export function HeroBackdrop({ dataSaver = false }: { dataSaver?: boolean }) {
  const mode = useSceneCapability(dataSaver);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {mode === 'static' ? (
        <StaticBackdrop />
      ) : (
        <SceneErrorBoundary>
          <HeroScene animated={mode === 'full'} />
        </SceneErrorBoundary>
      )}

      {/*
        Lớp phủ phải đủ để chữ dễ đọc nhưng KHÔNG được che mất cảnh.
        Trước đây dùng gradient dọc bắt đầu bằng màu kem đục hoàn toàn, kết quả
        là toàn bộ khung cảnh bị phủ kín.

        Trên máy tính: chỉ làm sáng nửa trái nơi đặt chữ, nửa phải để trong suốt
        cho thấy cổng torii và núi. Trên điện thoại chữ chiếm hết bề ngang nên
        dùng một lớp mờ đều nhưng nhẹ.
      */}
      <div className="absolute inset-0 bg-washi/70 dark:bg-[#141821]/70 md:hidden" />
      {/*
        Mốc `via-…-55%` đặt đúng ranh giới cột chữ (lưới 2 cột, chữ chiếm nửa
        trái). Nhờ vậy toàn bộ phần chữ nằm trên nền gần như đục, còn từ giữa
        sang phải mở dần ra cho thấy cổng torii và núi.
      */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-washi from-30% via-washi/70 via-55% to-transparent dark:from-[#141821] dark:via-[#141821]/70 md:block" />

      {/* Mép dưới hoà dần vào nền trang để nối liền với phần nội dung kế tiếp */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-washi dark:to-[#141821]" />
    </div>
  );
}
