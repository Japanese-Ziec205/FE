'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ClipboardList, Clock, Info, X } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi, useAction } from '@/hooks/useApi';
import type { ExamGenerated, ExamHistoryItem } from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

/**
 * Hai biến thể đề.
 *
 * Bản đầy đủ cần câu hỏi Nghe, mà kho âm thanh chưa có — nên nút của nó bị khoá
 * kèm lý do rõ ràng. Để nút bấm được rồi báo lỗi "thiếu câu hỏi" sau khi người
 * dùng đã hào hứng bấm vào thì tệ hơn nhiều.
 */
const VARIANTS = [
  {
    id: 'reading_writing',
    name: 'Đề luyện Đọc & Viết',
    description: 'Từ vựng, Kanji, ngữ pháp và đọc hiểu. Bám sát ma trận JLPT thật.',
    questions: 64,
    minutes: 60,
    maxScore: 120,
    required: 60,
    available: true,
  },
  {
    id: 'standard',
    name: 'Đề đầy đủ N5',
    description: 'Gồm cả phần Nghe hiểu. Đang chờ kho file âm thanh nên chưa mở.',
    questions: 88,
    minutes: 90,
    maxScore: 180,
    required: 80,
    available: false,
  },
];

export default function ExamHomePage() {
  const router = useRouter();
  const history = useApi<ExamHistoryItem[]>('/exams/history');

  const generate = useAction((variant: string) =>
    api.post<ExamGenerated>('/exams/generate', { levelCode: 'N5', variant }),
  );

  const start = async (variant: string) => {
    const result = await generate.run(variant);
    if (result) router.push(`/thi-thu/${result.attemptId}`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-sumi">Thi thử JLPT</h1>
        <p className="mt-1 text-sumi-muted">
          Đề được sinh mới mỗi lần từ ngân hàng câu hỏi, theo đúng ma trận và cách chấm của
          kỳ thi thật.
        </p>
      </header>

      {generate.error && <Alert tone="error">{generate.error}</Alert>}

      {/*
        Quy tắc điểm liệt là thứ khiến nhiều người trượt oan dù tổng điểm cao.
        Nói trước khi thi, không phải sau khi nhận kết quả.
      */}
      <Alert tone="info" title="Cách tính đỗ của JLPT">
        Phải đạt <strong>cả hai</strong> điều kiện: tổng điểm trên ngưỡng, <strong>và</strong> không
        nhóm nào dưới điểm liệt. Chỉ cần một nhóm dưới ngưỡng là trượt, dù tổng điểm có cao đến đâu.
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {VARIANTS.map((v) => (
          <Card key={v.id} className={cn('flex flex-col', !v.available && 'opacity-70')}>
            <h2 className="text-lg font-semibold text-sumi">{v.name}</h2>
            <p className="mt-1 flex-1 text-sm text-sumi-muted">{v.description}</p>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-washi py-2">
                <dt className="text-xs text-sumi-muted">Số câu</dt>
                <dd className="font-semibold text-sumi">{v.questions}</dd>
              </div>
              <div className="rounded-xl bg-washi py-2">
                <dt className="text-xs text-sumi-muted">Thời gian</dt>
                <dd className="font-semibold text-sumi">{v.minutes}′</dd>
              </div>
              <div className="rounded-xl bg-washi py-2">
                <dt className="text-xs text-sumi-muted">Đỗ từ</dt>
                <dd className="font-semibold text-sumi">
                  {v.required}/{v.maxScore}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              {v.available ? (
                <Button
                  fullWidth
                  onClick={() => start(v.id)}
                  isLoading={generate.isRunning}
                >
                  Bắt đầu thi
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-black/5 px-4 py-3 text-sm text-sumi-muted">
                  <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Chưa mở — cần kho file âm thanh cho phần Nghe
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-sumi">Lịch sử thi</h2>
        {history.isLoading ? (
          <Spinner label="Đang tải lịch sử..." />
        ) : history.error ? (
          <ErrorState message={history.error} onRetry={history.reload} />
        ) : !history.data || history.data.length === 0 ? (
          <Card className="flex items-center gap-3 py-8 text-sumi-muted">
            <ClipboardList className="h-6 w-6 shrink-0" aria-hidden="true" />
            Bạn chưa thi lần nào. Đừng ngại điểm thấp ở lần đầu — mục đích của thi thử là
            tìm ra chỗ yếu, không phải để lấy điểm đẹp.
          </Card>
        ) : (
          <ul className="space-y-2">
            {history.data.map((h) => (
              <li key={h.attemptId}>
                <Link
                  href={`/thi-thu/${h.attemptId}/ket-qua`}
                  className="card flex items-center gap-3 p-4 transition hover:shadow-card-hover"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      h.passed ? 'bg-matcha-50 text-matcha-700' : 'bg-sakura-50 text-sakura-700',
                    )}
                    aria-hidden="true"
                  >
                    {h.passed ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sumi">
                      {h.levelCode} · {h.code}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-sumi-muted">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Date(h.submittedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-sumi">{h.scaledScore}</p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        h.passed ? 'text-matcha-700' : 'text-sakura-700',
                      )}
                    >
                      {h.passed ? 'Đỗ' : 'Chưa đạt'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
