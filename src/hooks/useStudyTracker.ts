'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiException } from '@/lib/api-client';

interface HeartbeatResult {
  countedTodaySeconds: number;
  dailyGoalSeconds: number;
  goalMet: boolean;
  sessionSeconds: number;
  capReached: boolean;
}

/**
 * Nhịp gửi mỗi 55–75 giây, KHÔNG cố định.
 *
 * Backend đánh dấu là đáng ngờ khi 6 nhịp gần nhất lệch nhau dưới 0,5 giây, vì
 * script tự động gửi đúng 60,0 giây một lần còn người thật thì không. Một
 * `setInterval(60_000)` chạy trên máy nối mạng tốt lại tạo ra đúng kiểu nhịp
 * đều đó — và giờ học sẽ bị lặng lẽ loại bỏ mà không báo lỗi gì.
 *
 * Trần dưới phải trên 45 giây (khoảng cách tối thiểu backend chấp nhận), trần
 * trên phải dưới 90 giây (quá mức đó phần dư bị cắt, học thật cũng không được
 * tính đủ).
 */
const MIN_INTERVAL_MS = 55_000;
const MAX_INTERVAL_MS = 75_000;

/** Không thao tác quá lâu thì coi như đã rời đi, ngừng đếm. */
const IDLE_TIMEOUT_MS = 3 * 60_000;

function nextDelay(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

/**
 * Ghi nhận thời gian học thật.
 *
 * Nguyên tắc: client KHÔNG bao giờ gửi lên "tôi đã học bao nhiêu phút". Nó chỉ
 * báo "tôi vẫn đang ở đây", còn thời lượng do server tự tính từ khoảng cách
 * giữa các nhịp mà chính nó ghi nhận. Nhờ vậy không ai sửa được số giờ học
 * bằng cách gọi API thẳng.
 *
 * Ngừng đếm khi người dùng chuyển tab hoặc bỏ đó không đụng tới — nếu vẫn đếm
 * thì con số "giờ học" mất hết ý nghĩa.
 */
export type StudyContext = 'lesson' | 'srs' | 'exam' | 'practice' | 'reading' | 'writing';

export function useStudyTracker(contextType: StudyContext) {
  const [today, setToday] = useState<HeartbeatResult | null>(null);

  // Giữ ở ref vì các giá trị này thay đổi liên tục nhưng không cần vẽ lại gì
  const sessionRef = useRef<string | null>(null);
  // Khởi tạo 0 rồi đặt trong effect: gọi Date.now() lúc render là hàm không
  // thuần khiết, và React Compiler chặn đúng vì lý do đó.
  const lastActivityRef = useRef(0);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    lastActivityRef.current = Date.now();

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };

    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'scroll',
      'focus',
    ];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));

    const beat = async () => {
      if (stopped || !sessionRef.current) return;

      const idle = Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS;
      const hidden = document.visibilityState === 'hidden';

      if (!idle && !hidden) {
        try {
          const result = await api.post<HeartbeatResult>('/study/heartbeat', {
            sessionId: sessionRef.current,
          });
          if (!stopped) setToday(result);
        } catch (err) {
          /**
           * Phiên hết hạn (người dùng để máy ngủ, hoặc tab mở quá lâu) thì mở
           * phiên mới thay vì bỏ cuộc im lặng — nếu không, người học quay lại
           * bàn học sẽ không được tính thêm một giây nào nữa.
           */
          if (err instanceof ApiException && err.code === 'STUDY_SESSION_NOT_FOUND') {
            sessionRef.current = null;
            await start();
          }
          // Các lỗi khác (mạng chập chờn, gửi quá sớm) bỏ qua: nhịp sau sẽ bù.
        }
      }

      if (!stopped) timer = setTimeout(beat, nextDelay());
    };

    const start = async () => {
      try {
        const res = await api.post<{ sessionId: string }>('/study/sessions/start', {
          type: contextType,
        });
        if (stopped) {
          // Component đã bị gỡ trong lúc chờ — đóng ngay để không treo phiên
          void api.post(`/study/sessions/${res.sessionId}/end`).catch(() => undefined);
          return;
        }
        sessionRef.current = res.sessionId;
        timer = setTimeout(beat, nextDelay());
      } catch {
        // Không mở được phiên thì thôi, không chặn người dùng học
      }
    };

    void start();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, markActive));

      const id = sessionRef.current;
      sessionRef.current = null;
      if (id) {
        // Đóng phiên khi rời trang. Không await được trong hàm dọn dẹp, nhưng
        // backend vẫn có cơ chế tự đóng phiên treo nên mất request này cũng không sao.
        void api.post(`/study/sessions/${id}/end`).catch(() => undefined);
      }
    };
  }, [contextType]);

  return today;
}
