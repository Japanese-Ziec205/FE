'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi, useAction } from '@/hooks/useApi';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import type { UserStats } from '@/lib/types';

const GOALS = [
  { value: 'jlpt', label: 'Thi lấy chứng chỉ JLPT' },
  { value: 'study_abroad', label: 'Du học Nhật Bản' },
  { value: 'work', label: 'Đi làm / xuất khẩu lao động' },
  { value: 'communication', label: 'Giao tiếp hằng ngày' },
  { value: 'hobby', label: 'Sở thích cá nhân' },
];

import { LEVEL_LIST } from '@/lib/jlpt-levels';

/**
 * Các mốc phút mỗi ngày.
 *
 * Mốc thấp nhất cố ý là 5 phút, không phải 30. Người mới thường đặt mục tiêu
 * quá cao rồi bỏ cuộc sau vài ngày — mà chỉ tiêu này còn quyết định số thẻ mới
 * mỗi ngày, nên đặt cao là tự chuốc lấy đống thẻ tồn đọng.
 */
const MINUTES = [5, 10, 15, 20, 30, 45, 60];

export function LearningGoalCard() {
  const stats = useApi<UserStats>('/users/me/stats');
  const [goal, setGoal] = useState('');
  const [target, setTarget] = useState('');
  const [minutes, setMinutes] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useAction(async (body: Record<string, unknown>) => {
    const result = await api.patch('/users/me/learning', body);
    stats.reload();
    return result;
  });

  // Giá trị hiển thị: ưu tiên bản nháp người dùng đang sửa, nếu chưa sửa thì
  // lấy theo dữ liệu máy chủ. Nhờ vậy không cần useEffect đồng bộ prop vào state.
  const currentMinutes = minutes ?? stats.data?.dailyGoalMinutes ?? 10;
  const currentLevel = target || stats.data?.currentLevelCode || 'N5';

  const submit = async () => {
    setSaved(false);
    const body: Record<string, unknown> = { dailyGoalMinutes: currentMinutes };
    if (goal) body.learningGoal = goal;
    if (target) body.targetLevel = target;
    const result = await save.run(body);
    if (result) {
      setSaved(true);
      setMinutes(null);
      setTarget('');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Mục tiêu học tập"
        subtitle="Chỉ tiêu mỗi ngày quyết định số thẻ mới hệ thống đưa cho bạn."
      />

      {saved && (
        <Alert tone="success" className="mb-4">
          Đã lưu mục tiêu.
        </Alert>
      )}
      {save.error && (
        <Alert tone="error" className="mb-4">
          {save.error}
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="muc-tieu" className="mb-1.5 block text-sm font-medium text-sumi">
            Bạn học tiếng Nhật để làm gì?
          </label>
          <select
            id="muc-tieu"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#E8E2D9] bg-white px-3 text-sumi focus:border-sakura-400 focus:outline-none focus:ring-2 focus:ring-sakura-100"
          >
            <option value="">— Chọn mục tiêu —</option>
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cap-do" className="mb-1.5 block text-sm font-medium text-sumi">
            Cấp độ đang học
          </label>
          <select
            id="cap-do"
            value={currentLevel}
            onChange={(e) => setTarget(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#E8E2D9] bg-white px-3 text-sumi focus:border-sakura-400 focus:outline-none focus:ring-2 focus:ring-sakura-100"
          >
            {LEVEL_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} — {l.nameVi} ({l.vocabulary.toLocaleString('vi-VN')} từ,{' '}
                {l.kanji.toLocaleString('vi-VN')} chữ Hán)
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-sumi-muted">
            Đổi cấp độ sẽ đổi bài học, thẻ ôn tập và đề thi thử theo cấp mới. Tiến độ và thẻ đã
            học của bạn vẫn được giữ nguyên, không mất đi đâu cả.
          </p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-sumi">
            Mỗi ngày học bao nhiêu phút?
          </legend>
          <div className="flex flex-wrap gap-2">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                aria-pressed={currentMinutes === m}
                className={
                  currentMinutes === m
                    ? 'rounded-xl bg-sakura-500 px-4 py-2 text-sm font-semibold text-white'
                    : 'rounded-xl bg-white px-4 py-2 text-sm font-medium text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-sakura-50'
                }
              >
                {m}′
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-sumi-muted">
            Chọn mức bạn chắc chắn duy trì được, đừng chọn mức bạn mong muốn. Học 5 phút mỗi
            ngày trong một năm hơn hẳn 60 phút mỗi ngày trong hai tuần rồi bỏ.
          </p>
        </fieldset>

        <Button onClick={submit} isLoading={save.isRunning}>
          <Target className="h-4 w-4" aria-hidden="true" />
          Lưu mục tiêu
        </Button>
      </div>
    </Card>
  );
}
