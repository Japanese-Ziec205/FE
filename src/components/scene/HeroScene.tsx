'use client';

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MountFuji, Pagoda, PetalRain, SakuraTree, Torii, Water } from './objects';

/**
 * Camera phản ứng với cuộn trang và vị trí con trỏ.
 *
 * Dùng nội suy mượt (lerp) thay vì gán thẳng: gán thẳng khiến camera giật theo
 * từng sự kiện chuột, còn lerp cho cảm giác trôi tự nhiên.
 */
function CameraRig({ animated }: { animated: boolean }) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  useFrame(() => {
    if (!animated) return;

    // Đọc trực tiếp thay vì gắn state React — tránh render lại 60 lần/giây
    if (typeof window !== 'undefined') {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scroll.current = Math.min(1, window.scrollY / max);
    }

    const targetX = pointer.current.x * 2.2;
    const targetY = 3 + pointer.current.y * 1.1 + scroll.current * 3.5;
    const targetZ = 16 - scroll.current * 5;

    camera.position.x += (targetX - camera.position.x) * 0.045;
    camera.position.y += (targetY - camera.position.y) * 0.045;
    camera.position.z += (targetZ - camera.position.z) * 0.045;
    camera.lookAt(0, 2.2 + scroll.current * 1.4, 0);
  });

  useFrame(({ pointer: p }) => {
    pointer.current.x = p.x;
    pointer.current.y = p.y;
  });

  return null;
}

/** Nhóm vật thể xoay nhẹ theo con trỏ, tạo cảm giác chiều sâu. */
function ParallaxGroup({
  children,
  factor = 0.06,
  animated,
}: {
  children: React.ReactNode;
  factor?: number;
  animated: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ pointer }) => {
    if (!ref.current || !animated) return;
    ref.current.rotation.y += (pointer.x * factor - ref.current.rotation.y) * 0.05;
    ref.current.rotation.x += (-pointer.y * factor * 0.4 - ref.current.rotation.x) * 0.05;
  });

  return <group ref={ref}>{children}</group>;
}

export default function HeroScene({ animated = true }: { animated?: boolean }) {
  return (
    <Canvas
      // Giới hạn tỉ lệ điểm ảnh: màn hình retina mà render 3x thì máy yếu chết ngay
      dpr={[1, 1.6]}
      camera={{ position: [0, 3, 16], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
    >
      {/* Sương mù tạo chiều sâu và giấu rìa scene, khỏi cần vẽ xa */}
      <fog attach="fog" args={['#FFF9F2', 18, 46]} />

      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 12, 8]} intensity={1.15} color="#FFF3E0" />
      <directionalLight position={[-8, 4, -6]} intensity={0.35} color="#C6D2E8" />

      <CameraRig animated={animated} />

      {/* Lớp xa — núi Phú Sĩ, gần như đứng yên */}
      <ParallaxGroup factor={0.02} animated={animated}>
        <MountFuji position={[-1, -0.5, -26]} scale={2.6} />
      </ParallaxGroup>

      {/* Lớp giữa — chùa và cây */}
      <ParallaxGroup factor={0.05} animated={animated}>
        <Pagoda position={[8.5, 0, -13]} scale={1.25} />
        <SakuraTree position={[-9.5, 0, -11]} scale={1.5} seed={1} />
        <SakuraTree position={[11, 0, -8]} scale={1.15} seed={2} />
      </ParallaxGroup>

      {/* Lớp gần — cổng torii là tâm điểm */}
      <ParallaxGroup factor={0.09} animated={animated}>
        <Torii position={[0, 0, -3]} scale={1.35} />
        <SakuraTree position={[-5.5, 0, 1]} scale={1.25} seed={3} />
        <SakuraTree position={[6, 0, 0.5]} scale={1.1} seed={4} />
      </ParallaxGroup>

      <Water position={[0, -0.05, -4]} />

      {/* Ở chế độ giảm chuyển động vẫn hiện cánh hoa nhưng đứng yên */}
      <PetalRain count={animated ? 260 : 90} animated={animated} />
    </Canvas>
  );
}
