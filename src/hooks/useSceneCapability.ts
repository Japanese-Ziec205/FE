'use client';

import { useSyncExternalStore } from 'react';

export type SceneMode = 'full' | 'reduced' | 'static';

/**
 * Kết quả dò không đổi trong suốt vòng đời trang, nên tính một lần rồi nhớ lại.
 * Việc này cũng giúp getSnapshot trả về cùng một giá trị mỗi lần React gọi —
 * điều kiện bắt buộc của useSyncExternalStore.
 */
let cachedMode: SceneMode | null = null;

function detectMode(): SceneMode {
  if (cachedMode) return cachedMode;

  // --- 1. Người dùng đã tắt hiệu ứng chuyển động trong hệ điều hành ---
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- 2. Mạng chậm hoặc trình duyệt báo đang tiết kiệm dữ liệu ---
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  const saveData =
    connection?.saveData === true || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');

  // --- 3. Năng lực thiết bị ---
  const cores = navigator.hardwareConcurrency ?? 2;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 2;
  const weakDevice = cores <= 2 || memory <= 2;

  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGL = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    hasWebGL = false;
  }

  cachedMode =
    saveData || weakDevice || !hasWebGL ? 'static' : reducedMotion ? 'reduced' : 'full';
  return cachedMode;
}

// Năng lực thiết bị không thay đổi giữa chừng nên không cần theo dõi gì
const subscribe = () => () => {};

/**
 * Quyết định có nên chạy cảnh 3D hay không.
 *
 * Dự án hướng tới người học dùng điện thoại cũ và mạng tính theo dung lượng,
 * nên 3D không bao giờ được bật vô điều kiện.
 *
 * Dùng useSyncExternalStore thay vì useEffect + setState: đây đúng là bài toán
 * "đọc trạng thái từ hệ thống bên ngoài", và server luôn nhận 'static' nên
 * không bao giờ lệch giữa render phía server và phía client.
 */
export function useSceneCapability(userDataSaver = false): SceneMode {
  const detected = useSyncExternalStore(
    subscribe,
    detectMode,
    () => 'static' as SceneMode, // ảnh chụp phía server
  );

  // Người dùng tự bật tiết kiệm dữ liệu thì luôn ưu tiên lựa chọn của họ
  return userDataSaver ? 'static' : detected;
}
