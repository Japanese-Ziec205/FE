'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ClipboardList, Clock, Lock, ScrollText, Sparkles } from 'lucide-react';

import { useApi, useAction } from '@/hooks/useApi';
import { api } from '@/lib/api-client';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ErrorState, ProgressBar, Spinner } from '@/components/ui/States';
import { LEVEL_INFO, JLPT_LEVELS, type JlptLevel } from '@/lib/jlpt-levels';
import { useEntitlements } from '@/hooks/useEntitlements';
import type { CoverageCount, ExamGenerated, LevelOverview } from '@/lib/learn-types';
import { cn } from '@/lib/utils';

/** Nhãn và màu cho ba mức độ đề. Khoá khớp `variant` mà máy chủ trả về. */
const TIER_STYLE: Record<string, { label: string; chip: string }> = {
  easy: { label: 'Dễ', chip: 'bg-matcha-50 text-matcha-800' },
  medium: { label: 'Trung bình', chip: 'bg-yamabuki-50 text-yamabuki-800' },
  hard: { label: 'Khó', chip: 'bg-sakura-50 text-sakura-700' },
  standard: { label: 'Chuẩn', chip: 'bg-ai-50 text-ai-600' },
  reading_writing: { label: 'Đọc & Viết', chip: 'bg-ai-50 text-ai-600' },
};

export default function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level: raw } = use(params);
  const level = raw.toUpperCase() as JlptLevel;
  const valid = JLPT_LEVELS.includes(level);

  const overview = useApi<LevelOverview>(valid ? `/public/levels/${level}` : null);
  const info = valid ? LEVEL_INFO[level] : null;

  if (!valid || !info) {
    return (
      <ErrorState message={`Không có cấp độ "${raw}". Các cấp độ hợp lệ là N5, N4, N3, N2 và N1.`} />
    );
  }

  if (overview.isLoading) return <Spinner label={`Đang tải kiến thức ${level}...`} />;
  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.reload} />;

  const data = overview.data;

  return (
    <div className="space-y-6">
      {/* ---------- Giới thiệu cấp độ ---------- */}
      <Card className="bg-gradient-to-br from-white to-sakura-50">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sakura-500 text-2xl font-bold text-white">
            {level}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-sumi">
              {level} — {info.nameVi}
            </h1>
            <p className="mt-0.5 text-sakura-600">{info.tagline}</p>
            <p className="mt-2 text-sumi-muted">{info.canDo}</p>
            <p className="mt-2 text-sm text-sumi-muted">
              Kỳ thi thật kéo dài <strong>{info.examMinutes} phút</strong>. Người học thường cần
              khoảng <strong>{info.studyHours}</strong> tính từ lúc chưa biết gì.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------- Kho kiến thức ---------- */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-sumi">Kiến thức của cấp {level}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <CoverageCard
            title="Từ vựng"
            href={`/hoc?tab=tu-vung&level=${level}`}
            icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
            count={data!.content.vocabulary}
            unit="từ"
          />
          <CoverageCard
            title="Hán tự"
            href={`/hoc?tab=kanji&level=${level}`}
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            count={data!.content.kanji}
            unit="chữ"
          />
          <CoverageCard
            title="Ngữ pháp"
            href={`/hoc?tab=ngu-phap&level=${level}`}
            icon={<ScrollText className="h-5 w-5" aria-hidden="true" />}
            count={data!.content.grammar}
            unit="mẫu"
          />
        </div>
        <p className="mt-3 text-sm text-sumi-muted">
          Con số bên trái là những gì kho của Kizuna đang có, bên phải là những gì kỳ thi thật
          đòi hỏi. Chúng mình hiện rõ cả hai để bạn biết mình đang ở đâu — kho vẫn đang được bổ
          sung mỗi tuần.
        </p>
      </section>

      {/* ---------- Đề thi thử ---------- */}
      <ExamSection level={level} exams={data!.exams} />
    </div>
  );
}

function CoverageCard({
  title,
  href,
  icon,
  count,
  unit,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  count: CoverageCount;
  unit: string;
}) {
  const percent = count.expected > 0 ? (count.available / count.expected) * 100 : 0;

  return (
    <Link href={href} className="card block p-5 transition hover:shadow-card-hover">
      <div className="flex items-center gap-2 text-sumi-muted">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-sumi">
        {count.available.toLocaleString('vi-VN')}
        <span className="ml-1 text-base font-medium text-sumi-muted">
          / {count.expected.toLocaleString('vi-VN')} {unit}
        </span>
      </p>
      <div className="mt-3">
        <ProgressBar percent={percent} label={`Kho ${title} đã có`} tone="matcha" />
      </div>
    </Link>
  );
}

/**
 * Danh sách đề thi thử theo mức độ.
 *
 * Thi thử là tính năng trả phí. Người dùng miễn phí vẫn THẤY đầy đủ danh sách
 * — giấu đi thì họ không biết mình đang bỏ lỡ gì — nhưng nút bấm sẽ dẫn sang
 * trang gói thay vì tạo đề.
 */
function ExamSection({ level, exams }: { level: JlptLevel; exams: LevelOverview['exams'] }) {
  const router = useRouter();
  const { canTakeMockExam, isLoading } = useEntitlements();

  // Ba mức độ trước, các biến thể cũ (chuẩn / đọc–viết) xếp sau
  const ordered = useMemo(() => {
    const rank: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
    return [...exams].sort((a, b) => (rank[a.variant] ?? 9) - (rank[b.variant] ?? 9));
  }, [exams]);

  const start = useAction(async (variant: string) => {
    const exam = await api.post<ExamGenerated>('/exams/generate', { levelCode: level, variant });
    router.push(`/thi-thu/${exam.attemptId}`);
  });

  return (
    <section>
      <CardHeader
        title={`Đề thi thử ${level}`}
        subtitle="Mỗi lần bấm là một đề mới, rút từ ngân hàng câu hỏi theo đúng ma trận đề thật."
      />

      {start.error && (
        <Alert tone="error" className="mb-4">
          {start.error}
        </Alert>
      )}

      {!isLoading && !canTakeMockExam && (
        <Alert tone="info" className="mb-4">
          Thi thử là tính năng của gói trả phí. Học bài và ôn tập vẫn miễn phí như thường —{' '}
          <Link href="/goi-hoc" className="font-semibold underline">
            xem hai gói tại đây
          </Link>
          .
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {ordered.map((exam) => {
          const style = TIER_STYLE[exam.variant] ?? { label: exam.variant, chip: 'bg-black/5' };
          return (
            <Card key={exam.variant} className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', style.chip)}>
                  {style.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-sumi-muted">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {exam.durationMinutes} phút
                </span>
              </div>

              <p className="mt-3 flex-1 text-sm text-sumi-muted">{exam.descriptionVi}</p>

              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-sumi-muted">Số câu</dt>
                  <dd className="font-medium text-sumi">{exam.questionCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sumi-muted">Điểm đỗ</dt>
                  <dd className="font-medium text-sumi">
                    {exam.totalRequired}/{exam.maxScore}
                  </dd>
                </div>
              </dl>

              {canTakeMockExam ? (
                <Button
                  className="mt-4"
                  fullWidth
                  isLoading={start.isRunning}
                  onClick={() => start.run(exam.variant)}
                >
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Bắt đầu thi
                </Button>
              ) : (
                <Button
                  className="mt-4"
                  variant="outline"
                  fullWidth
                  onClick={() => router.push('/goi-hoc')}
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Mở khoá thi thử
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-sumi-muted">
        Đề nào báo &ldquo;chưa đủ câu hỏi&rdquo; nghĩa là ngân hàng câu hỏi cho cấp đó chưa dựng
        xong, chứ không phải lỗi của bạn. Ban biên soạn đang bổ sung dần.
      </p>
    </section>
  );
}
