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

    const targetX = state.pointer.x * 1.6;
    const targetY = 6.4 + state.pointer.y * 0.9 + scroll * 3.5;
    const targetZ = 17 - scroll * 5;

    // Nội suy mượt thay vì gán thẳng: gán thẳng làm camera giật theo từng
    // sự kiện chuột, còn nội suy cho cảm giác trôi tự nhiên.
    state.camera.position.x += (targetX - state.camera.position.x) * 0.045;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.045;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.045;
    // Nhìn xuống thấp để đường chân trời tụt xuống khoảng 2/3 khung hình,
    // chừa phần trên làm nền trời trống cho chữ.
    state.camera.lookAt(0, 0.6 + scroll * 1.4, 0);
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
      {/*
        Sương mù tạo chiều sâu, nhưng mốc bắt đầu phải nằm SAU vật thể chính.
        Camera ở z=16, cổng torii ở z=-3 nên cách nhau 19 đơn vị — để mốc sương
        ở 18 thì chính chủ thể đã chìm trong sương và núi Phú Sĩ (cách 42) gần
        như tan hẳn vào màu nền.
      */}
      <fog attach="fog" args={['#FFF9F2', 30, 75]} />

      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 12, 8]} intensity={1.15} color="#FFF3E0" />
      <directionalLight position={[-8, 4, -6]} intensity={0.35} color="#C6D2E8" />

      <CameraRig animated={animated} />

      {/*
        Bố cục dồn về nửa PHẢI là có chủ đích.

        Chữ tiêu đề nằm ở cột trái. Trước đây núi Phú Sĩ và cổng torii đều đặt ở
        x≈0 nên đâm thẳng vào sau chữ, vừa khó đọc vừa rối mắt. Giờ mọi chủ thể
        đều lệch sang phải, chừa nửa trái gần như trống trời cho phần chữ.
      */}

      {/* Lớp xa — núi Phú Sĩ. Đẩy xa và thu nhỏ để thành hậu cảnh, không tranh
          chỗ với chủ thể chính như trước. */}
      <ParallaxGroup factor={0.02} animated={animated}>
        <MountFuji position={[14, -1.2, -34]} scale={2.1} />
      </ParallaxGroup>

      {/* Lớp giữa — chùa lùi hẳn ra rìa phải */}
      <ParallaxGroup factor={0.05} animated={animated}>
        <Pagoda position={[17, 0, -15]} scale={1.2} />
        <SakuraTree position={[-15, 0, -13]} scale={1.5} seed={1} />
        <SakuraTree position={[13, 0, -9]} scale={1.2} seed={2} />
      </ParallaxGroup>

      {/* Lớp gần — cổng torii vẫn là tâm điểm nhưng đứng bên phải */}
      <ParallaxGroup factor={0.09} animated={animated}>
        <Torii position={[7.5, 0, -4]} scale={1.3} />
        <SakuraTree position={[-11, 0, 1]} scale={1.3} seed={3} />
        <SakuraTree position={[15, 0, 1]} scale={1.15} seed={4} />
      </ParallaxGroup>

      <Water position={[4, -0.05, -6]} />

      {/* Ở chế độ giảm chuyển động vẫn hiện cánh hoa nhưng đứng yên */}
      <PetalRain count={animated ? 260 : 90} animated={animated} />
    </Canvas>
  );
}
