'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookMarked, Check, Clock, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Mascot } from '@/components/ui/Mascot';
import { useAuthStore } from '@/lib/auth-store';
import { useAction } from '@/hooks/useApi';
import { api } from '@/lib/api-client';
import { LEVEL_LIST, type JlptLevel } from '@/lib/jlpt-levels';
import { cn } from '@/lib/utils';

/**
 * Màn hình chọn cấp độ, hiện ngay sau khi xác thực email.
 *
 * Cố ý đặt NGOÀI nhóm (learn): layout của nhóm đó sẽ đẩy người chưa chọn cấp
 * độ về đây, nên nếu trang này nằm trong đó thì sẽ tự đá chính mình vòng vòng.
 */
export default function ChooseLevelPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, onboardingCompleted, refreshUser } = useAuthStore();
  const [picked, setPicked] = useState<JlptLevel | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/dang-nhap');
    // Đã chọn rồi mà quay lại đây thì cho vào thẳng trang chính. Muốn đổi cấp
    // độ thì vào Hồ sơ — ở đó có ngữ cảnh để cảnh báo hệ quả của việc đổi.
    else if (onboardingCompleted) router.replace('/bang-dieu-khien');
  }, [isLoading, isAuthenticated, onboardingCompleted, router]);

  const save = useAction(async (level: JlptLevel) => {
    await api.patch('/users/me/learning', {
      targetLevel: level,
      learningGoal: 'jlpt',
      onboardingCompleted: true,
    });
    await refreshUser();
    router.replace('/bang-dieu-khien');
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-washi">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sakura-200 border-t-sakura-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-washi px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <Mascot pose="wave" className="mx-auto h-24 w-24" />
          <h1 className="mt-4 text-3xl font-bold text-sumi">
            Chào {user?.displayName}, bạn muốn học tới đâu?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sumi-muted">
            Chọn cấp độ bạn muốn chinh phục. Toàn bộ bài học, thẻ ôn tập và đề thi thử sẽ được
            sắp theo cấp độ này. Bạn đổi lại lúc nào cũng được trong phần Hồ sơ.
          </p>
        </header>

        {save.error && (
          <Alert tone="error" className="mt-6">
            {save.error}
          </Alert>
        )}

        <div className="mt-8 space-y-3">
          {LEVEL_LIST.map((level) => {
            const selected = picked === level.code;
            return (
              <button
                key={level.code}
                type="button"
                aria-pressed={selected}
                onClick={() => setPicked(level.code)}
                className={cn(
                  'card w-full p-5 text-left transition',
                  selected
                    ? 'ring-2 ring-sakura-400 bg-sakura-50/60'
                    : 'hover:shadow-card-hover',
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold',
                      selected ? 'bg-sakura-500 text-white' : 'bg-[#EFEAE3] text-sumi',
                    )}
                    aria-hidden="true"
                  >
                    {selected ? <Check className="h-7 w-7" /> : level.code}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h2 className="text-lg font-bold text-sumi">
                        {level.code} · {level.nameVi}
                      </h2>
                      <span className="text-sm text-sakura-600">{level.tagline}</span>
                    </div>
                    <p className="mt-1 text-sm text-sumi-muted">{level.canDo}</p>

                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-sumi-muted">
                      <div className="flex items-center gap-1.5">
                        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
                        <dt className="sr-only">Số từ vựng</dt>
                        <dd>{level.vocabulary.toLocaleString('vi-VN')} từ</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        <dt className="sr-only">Số chữ Hán</dt>
                        <dd>{level.kanji.toLocaleString('vi-VN')} chữ Hán</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <dt className="sr-only">Thời gian học ước tính</dt>
                        <dd>{level.studyHours}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8">
          <Button
            size="lg"
            fullWidth
            disabled={picked === null}
            isLoading={save.isRunning}
            onClick={() => picked && save.run(picked)}
          >
            {picked ? `Bắt đầu học ${picked}` : 'Chọn một cấp độ để tiếp tục'}
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-sumi-muted">
          Chưa chắc mình ở đâu? Cứ chọn <strong>N5</strong> — đó là điểm khởi đầu của tất cả mọi
          người, và bạn có thể nhảy cấp bất cứ lúc nào.
        </p>
      </div>
    </div>
  );
}
