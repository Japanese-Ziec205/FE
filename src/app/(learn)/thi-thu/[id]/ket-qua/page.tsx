'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Lightbulb, TrendingDown, TrendingUp, X } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import type { ExamResult, ExamReview, ExamReviewQuestion } from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, ProgressBar, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

const SKILL_LABEL: Record<string, string> = {
  language_knowledge: 'Kiến thức ngôn ngữ',
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
  writing: 'Viết',
  speaking: 'Nói',
};

export default function ExamResultPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const resultPath = useMemo(() => `/exams/attempts/${id}/result`, [id]);
  const reviewPath = useMemo(() => `/exams/attempts/${id}/review`, [id]);

  const result = useApi<ExamResult>(resultPath);
  const review = useApi<ExamReview>(reviewPath);
  const [showAll, setShowAll] = useState(false);

  if (result.isLoading) return <Spinner label="Đang tải kết quả..." />;
  if (result.error) return <ErrorState message={result.error} onRetry={result.reload} />;
  if (!result.data) return null;

  const r = result.data;

  return (
    <div className="space-y-6">
      {/* ---------- Kết quả tổng ---------- */}
      <Card className={cn('text-center', r.passed ? 'ring-2 ring-matcha-300' : 'ring-2 ring-sakura-200')}>
        <span
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full',
            r.passed ? 'bg-matcha-50 text-matcha-700' : 'bg-sakura-50 text-sakura-700',
          )}
          aria-hidden="true"
        >
          {r.passed ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
        </span>

        <h1 className="mt-3 text-2xl font-bold text-sumi">
          {r.passed ? 'Đỗ rồi! おめでとう！' : 'Chưa đạt lần này'}
        </h1>

        <p className="mt-2 text-4xl font-bold text-sumi">
          {r.scaledScore}
          <span className="text-xl font-medium text-sumi-muted">/{r.maxTotal}</span>
        </p>
        <p className="mt-1 text-sumi-muted">Ngưỡng đỗ: {r.totalRequired} điểm</p>

        {!r.passed && r.failExplanation && (
          <Alert tone="warning" className="mt-4 text-left">
            {r.failExplanation}
            {r.failReason === 'section_below' && (
              <>
                {' '}
                Đây chính là <strong>quy tắc điểm liệt</strong>: tổng điểm đã đủ nhưng một nhóm
                dưới ngưỡng nên vẫn trượt.
              </>
            )}
          </Alert>
        )}
      </Card>

      {/* ---------- Điểm từng nhóm ---------- */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-sumi">Điểm từng nhóm</h2>
        <div className="space-y-3">
          {r.sectionScores.map((s) => (
            <Card key={s.code} className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium text-sumi">{s.nameVi}</h3>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    s.passed ? 'text-matcha-700' : 'text-beni',
                  )}
                >
                  {s.passed ? 'Đạt' : 'Dưới điểm liệt'}
                </span>
              </div>

              <p className="mt-1 text-2xl font-bold text-sumi">
                {s.scaled}
                <span className="text-base font-medium text-sumi-muted">/{s.maxScaled}</span>
              </p>

              <div className="mt-2">
                <ProgressBar
                  percent={(s.scaled / s.maxScaled) * 100}
                  label={`Điểm nhóm ${s.nameVi}`}
                  tone={s.passed ? 'matcha' : 'sakura'}
                />
                <p className="mt-1 text-sm text-sumi-muted">
                  Đúng {s.raw}/{s.rawTotal} câu · điểm liệt là {s.minRequired}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Năng lực theo kỹ năng ---------- */}
      {Object.keys(r.skillRadar).length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-sumi">Tỉ lệ đúng theo kỹ năng</h2>
          <Card>
            <ul className="space-y-3">
              {Object.entries(r.skillRadar).map(([skill, percent]) => (
                <li key={skill}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-sumi">{SKILL_LABEL[skill] ?? skill}</span>
                    <span className="font-medium text-sumi">{percent}%</span>
                  </div>
                  <ProgressBar
                    percent={percent}
                    label={`Tỉ lệ đúng ${SKILL_LABEL[skill] ?? skill}`}
                    tone={percent >= 60 ? 'matcha' : 'sakura'}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* ---------- Khuyến nghị ---------- */}
      {r.recommendations.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-sumi">Nên làm gì tiếp theo</h2>
          <Card>
            <ul className="space-y-3">
              {r.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-yamabuki-600" aria-hidden="true" />
                  <p className="text-sumi-muted">{rec.reason}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* ---------- Mạnh / yếu theo mondai ---------- */}
      <section className="grid gap-4 md:grid-cols-2">
        <MondaiList
          title="Phần còn yếu"
          icon={<TrendingDown className="h-5 w-5 text-beni" aria-hidden="true" />}
          items={r.weakMondai}
          empty="Không có phần nào dưới 50%. Rất tốt!"
        />
        <MondaiList
          title="Phần đã vững"
          icon={<TrendingUp className="h-5 w-5 text-matcha-600" aria-hidden="true" />}
          items={r.strongMondai}
          empty="Chưa phần nào đạt trên 80%. Cứ từ từ."
        />
      </section>

      {/* ---------- Xem lại từng câu ---------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-sumi">Xem lại bài làm</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-sumi-muted">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8E2D9] text-sakura-500 focus:ring-sakura-400"
            />
            Hiện cả câu làm đúng
          </label>
        </div>

        {review.isLoading ? (
          <Spinner label="Đang tải bài làm..." />
        ) : review.error ? (
          <ErrorState message={review.error} onRetry={review.reload} />
        ) : (
          <div className="space-y-5">
            {(review.data ?? []).map((section) => {
              const shown = showAll
                ? section.questions
                : section.questions.filter((q) => !q.isCorrect);
              if (shown.length === 0) return null;

              return (
                <div key={section.code}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sumi-muted">
                    {section.nameVi}
                    <span className="ml-2 font-normal normal-case">({shown.length} câu)</span>
                  </h3>
                  <div className="space-y-3">
                    {shown.map((q) => (
                      <ReviewCard key={q.order} question={q} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/thi-thu">
          <Button>Thi lần nữa</Button>
        </Link>
        <Link href="/on-tap">
          <Button variant="outline">Đi ôn tập</Button>
        </Link>
      </div>
    </div>
  );
}

function MondaiList({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: { code: string; nameVi: string; correct: number; total: number }[];
  empty: string;
}) {
  return (
    <Card>
      <h3 className="flex items-center gap-2 font-semibold text-sumi">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-sumi-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((m) => (
            <li key={m.code} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-sumi">{m.nameVi}</span>
              <span className="shrink-0 font-medium text-sumi-muted">
                {m.correct}/{m.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ReviewCard({ question: q }: { question: ExamReviewQuestion }) {
  const correctIds = new Set(q.correctOptionIds);
  const userAnswer = typeof q.userAnswer === 'string' ? q.userAnswer : null;

  return (
    <Card className={cn('p-4', q.isCorrect ? 'ring-1 ring-matcha-200' : 'ring-1 ring-sakura-200')}>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-white',
            q.isCorrect ? 'bg-matcha-500' : 'bg-beni',
          )}
          aria-hidden="true"
        >
          {q.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </span>
        <span className="text-sm text-sumi-muted">
          Câu {q.order} · {q.isCorrect ? 'Đúng' : 'Sai'}
        </span>
      </div>

      {q.passage && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-washi p-3 font-jp text-sm leading-loose text-sumi-muted">
          {q.passage.body}
        </p>
      )}

      <p className="mt-3 whitespace-pre-line font-jp text-lg text-sumi">{q.stem}</p>

      {/*
        Dạng sắp xếp câu không có "phương án" theo nghĩa thông thường, nên chỉ
        hiện thứ tự đúng — bây giờ mới được phép cho xem.
      */}
      {q.correctSequence ? (
        <p className="mt-3 rounded-xl bg-matcha-50 px-3 py-2 font-jp text-sumi">
          Thứ tự đúng: {q.correctSequence.join('　')}
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {q.options.map((o) => {
            const isCorrect = correctIds.has(o.id);
            const isChosen = userAnswer === o.id;
            return (
              <li
                key={o.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 font-jp',
                  isCorrect && 'bg-matcha-50 text-matcha-800',
                  isChosen && !isCorrect && 'bg-sakura-50 text-sakura-800 line-through',
                  !isCorrect && !isChosen && 'text-sumi-muted',
                )}
              >
                <span className="flex-1">{o.text}</span>
                {isCorrect && <span className="shrink-0 text-xs font-sans font-semibold">Đáp án đúng</span>}
                {isChosen && !isCorrect && (
                  <span className="shrink-0 text-xs font-sans font-semibold">Bạn đã chọn</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {q.explanationVi && (
        <p className="mt-3 rounded-xl bg-black/[0.03] px-3 py-2 text-sm text-sumi-muted">
          💡 {q.explanationVi}
        </p>
      )}
    </Card>
  );
}
