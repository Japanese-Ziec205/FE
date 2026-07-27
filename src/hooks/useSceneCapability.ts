'use client';

import { useEffect, useState } from 'react';

export type SceneMode = 'full' | 'reduced' | 'static';

/**
 * Quyết định có nên chạy scene 3D hay không.
 *
 * Dự án hướng tới người học dùng điện thoại cũ và mạng tính theo dung lượng,
 * nên 3D KHÔNG bao giờ được bật vô điều kiện. Ba lớp thoái lui:
 *
 *  1. `prefers-reduced-motion` → dựng cảnh nhưng không hoạt hình
 *  2. Chế độ tiết kiệm dữ liệu (người dùng bật, hoặc trình duyệt báo mạng chậm)
 *     → ảnh tĩnh
 *  3. Máy yếu hoặc không có WebGL → ảnh tĩnh
 *
 * Trả về 'static' cho tới khi kiểm tra xong, để lần render đầu trên server và
 * trên client giống nhau, tránh lỗi hydration.
 */
export function useSceneCapability(userDataSaver = false): SceneMode {
  const [mode, setMode] = useState<SceneMode>('static');

  useEffect(() => {
    // --- 1. Người dùng đã tắt hiệu ứng chuyển động trong hệ điều hành ---
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 2. Tiết kiệm dữ liệu ---
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const saveData =
      userDataSaver ||
      connection?.saveData === true ||
      ['slow-2g', '2g'].includes(connection?.effectiveType ?? '');

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

    if (saveData || weakDevice || !hasWebGL) {
      setMode('static');
      return;
    }
    setMode(reducedMotion ? 'reduced' : 'full');
  }, [userDataSaver]);

  return mode;
}
