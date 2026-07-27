'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MountFuji, Pagoda, PetalRain, SakuraTree, Torii, Water } from './objects';

/**
 * Camera phản ứng với cuộn trang và vị trí con trỏ.
 *
 * Dùng nội suy mượt (lerp) thay vì gán thẳng: gán thẳng khiến camera giật theo
 * từng sự kiện chuột, còn lerp cho cảm giác trôi tự nhiên.
 */
function CameraRig({ animated }: { animated: boolean }) {
  // Giữ ở ref kiểu số nguyên thuỷ: cập nhật 60 lần/giây mà gắn vào state React
  // thì component sẽ render lại 60 lần/giây.
  const scrollRef = useRef(0);

  // Lấy camera từ tham số của useFrame chứ không bắt từ phạm vi render —
  // đối tượng lấy lúc render bị coi là bất biến.
  useFrame((state) => {
    if (!animated) return;

    const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
    scrollRef.current = Math.min(1, window.scrollY / max);
    const scroll = scrollRef.current;

    const targetX = state.pointer.x * 2.2;
    const targetY = 3 + state.pointer.y * 1.1 + scroll * 3.5;
    const targetZ = 16 - scroll * 5;

    // Nội suy mượt thay vì gán thẳng: gán thẳng làm camera giật theo từng
    // sự kiện chuột, còn nội suy cho cảm giác trôi tự nhiên.
    state.camera.position.x += (targetX - state.camera.position.x) * 0.045;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.045;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.045;
    state.camera.lookAt(0, 2.2 + scroll * 1.4, 0);
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
