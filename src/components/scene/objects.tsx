'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hình khối dựng bằng thủ tục thay vì tải model GLB.
 *
 * Một mesh GLB sinh từ ảnh thường nặng 2-5MB và có bề mặt lồi lõm không kiểm
 * soát được. Ở đây mỗi vật thể chỉ tốn vài trăm byte mã, cạnh sắc nét, và tải
 * tức thì — đúng thứ người dùng máy yếu, mạng chậm cần.
 */

/**
 * Sinh số giả ngẫu nhiên THUẦN KHIẾT từ một chỉ số.
 *
 * Không dùng Math.random() vì hàm này không thuần khiết: mỗi lần render sẽ ra
 * kết quả khác nhau, khiến React không thể ghi nhớ kết quả và cánh hoa nhảy
 * loạn mỗi khi component render lại. Băm bằng sin cho kết quả ổn định theo
 * chỉ số, tức là cùng một hạt giống luôn cho cùng một cảnh.
 */
function rand01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const VERMILION = '#D94F3D';
const VERMILION_DARK = '#A63A2C';
const INDIGO = '#1B3A6B';
const SNOW = '#F7F4EF';

/** Cổng Torii — biểu tượng dễ nhận nhất của Nhật Bản. */
export function Torii({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Hai cột trụ, hơi nghiêng vào trong như torii thật */}
      <mesh position={[-1.5, 1.6, 0]} rotation={[0, 0, 0.02]} castShadow>
        <cylinderGeometry args={[0.16, 0.19, 3.2, 12]} />
        <meshStandardMaterial color={VERMILION} roughness={0.7} />
      </mesh>
      <mesh position={[1.5, 1.6, 0]} rotation={[0, 0, -0.02]} castShadow>
        <cylinderGeometry args={[0.16, 0.19, 3.2, 12]} />
        <meshStandardMaterial color={VERMILION} roughness={0.7} />
      </mesh>

      {/* Kasagi — thanh ngang trên cùng, hơi cong lên hai đầu */}
      <mesh position={[0, 3.35, 0]} castShadow>
        <boxGeometry args={[4.2, 0.22, 0.42]} />
        <meshStandardMaterial color={VERMILION_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[-2.1, 3.44, 0]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.5, 0.18, 0.42]} />
        <meshStandardMaterial color={VERMILION_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[2.1, 3.44, 0]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.5, 0.18, 0.42]} />
        <meshStandardMaterial color={VERMILION_DARK} roughness={0.6} />
      </mesh>

      {/* Nuki — thanh ngang thứ hai */}
      <mesh position={[0, 2.75, 0]}>
        <boxGeometry args={[3.5, 0.16, 0.3]} />
        <meshStandardMaterial color={VERMILION} roughness={0.7} />
      </mesh>

      {/* Gakuzuka — trụ nhỏ nối hai thanh ngang */}
      <mesh position={[0, 3.06, 0]}>
        <boxGeometry args={[0.22, 0.45, 0.24]} />
        <meshStandardMaterial color={VERMILION_DARK} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Núi Phú Sĩ — nón cụt có chóp tuyết. */
export function MountFuji({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[6, 4, 32, 1, false]} />
        <meshStandardMaterial color={INDIGO} roughness={1} flatShading />
      </mesh>
      {/* Chóp tuyết đặt hơi cao hơn để nổi lên khỏi thân núi */}
      <mesh position={[0, 1.42, 0]}>
        <coneGeometry args={[1.7, 1.2, 32]} />
        <meshStandardMaterial color={SNOW} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** Chùa năm tầng — mỗi tầng nhỏ dần, có mái nhô ra. */
export function Pagoda({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const tiers = useMemo(
    () => [0, 1, 2, 3, 4].map((i) => ({
      y: i * 0.78,
      bodyWidth: 1.25 - i * 0.15,
      roofWidth: 1.95 - i * 0.22,
    })),
    [],
  );

  return (
    <group position={position} scale={scale}>
      {tiers.map((t, i) => (
        <group key={i} position={[0, t.y, 0]}>
          <mesh>
            <boxGeometry args={[t.bodyWidth, 0.5, t.bodyWidth]} />
            <meshStandardMaterial color="#8C6B4F" roughness={0.85} />
          </mesh>
          {/* Mái hình chóp bốn cạnh, xoay 45° để cạnh hướng ra trước */}
          <mesh position={[0, 0.38, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[t.roofWidth, 0.42, 4]} />
            <meshStandardMaterial color={VERMILION_DARK} roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
      {/* Sorin — chóp kim loại trên đỉnh */}
      <mesh position={[0, 4.35, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#C9A227" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Cây hoa anh đào — thân trụ và các cụm tán hình cầu. */
export function SakuraTree({
  position = [0, 0, 0],
  scale = 1,
  seed = 0,
}: {
  position?: [number, number, number];
  scale?: number;
  seed?: number;
}) {
  // Mỗi cây một dáng riêng nhưng cố định theo hạt giống
  const blossoms = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const base = seed * 100 + i * 7;
        return {
          pos: [
            (rand01(base) - 0.5) * 1.9,
            2.1 + rand01(base + 1) * 1.1,
            (rand01(base + 2) - 0.5) * 1.9,
          ] as [number, number, number],
          radius: 0.55 + rand01(base + 3) * 0.45,
          tint: rand01(base + 4) > 0.5 ? '#F7B4C2' : '#FBD9E0',
        };
      }),
    [seed],
  );

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.11, 0.2, 2, 8]} />
        <meshStandardMaterial color="#6B5344" roughness={1} />
      </mesh>
      {blossoms.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <icosahedronGeometry args={[b.radius, 1]} />
          <meshStandardMaterial color={b.tint} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Mưa cánh hoa anh đào.
 *
 * Dùng InstancedMesh: 1 lệnh vẽ cho toàn bộ cánh hoa thay vì n lệnh.
 * Với 260 cánh trên máy yếu, khác biệt là chạy mượt hay giật.
 */
export function PetalRain({
  count = 260,
  animated = true,
  bounds = { x: 26, y: 16, z: 14 },
}: {
  count?: number;
  animated?: boolean;
  bounds?: { x: number; y: number; z: number };
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const b = i * 11;
        return {
          x: (rand01(b) - 0.5) * bounds.x,
          y: rand01(b + 1) * bounds.y,
          z: (rand01(b + 2) - 0.5) * bounds.z,
          fallSpeed: 0.35 + rand01(b + 3) * 0.55,
          swayAmp: 0.4 + rand01(b + 4) * 1.1,
          swaySpeed: 0.4 + rand01(b + 5) * 0.9,
          phase: rand01(b + 6) * Math.PI * 2,
          spinSpeed: (rand01(b + 7) - 0.5) * 1.6,
          scale: 0.055 + rand01(b + 8) * 0.075,
        };
      }),
    [count, bounds.x, bounds.y, bounds.z],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = animated ? state.clock.elapsedTime : 0;

    petals.forEach((p, i) => {
      // Rơi liên tục, vòng lại lên đỉnh khi chạm đáy
      const fallen = (p.y - t * p.fallSpeed) % bounds.y;
      const y = fallen < 0 ? fallen + bounds.y : fallen;
      // Đung đưa ngang như cánh hoa thật, không rơi thẳng đứng
      const x = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp;

      dummy.position.set(x, y - bounds.y / 2, p.z);
      dummy.rotation.set(t * p.spinSpeed + p.phase, t * p.spinSpeed * 0.6, p.phase);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {/* Hình tròn 5 cạnh xấp xỉ cánh hoa — rẻ hơn nhiều so với texture có alpha */}
      <circleGeometry args={[1, 5]} />
      <meshBasicMaterial
        color="#F58FA3"
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/** Mặt nước phản chiếu mờ dưới chân cổng torii. */
export function Water({ position = [0, -0.02, 0] as [number, number, number] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={[60, 40]} />
      <meshStandardMaterial color="#C6D2E8" roughness={0.25} metalness={0.35} transparent opacity={0.85} />
    </mesh>
  );
}
