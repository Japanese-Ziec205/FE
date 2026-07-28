'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Flame, PartyPopper, RefreshCw, Sparkles } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi } from '@/hooks/useApi';
import type {
  SrsQueue,
  SrsQueueCard,
  SrsRating,
  SrsReviewResult,
  SrsStats,
} from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, ProgressBar, Spinner, StatTile } from '@/components/ui/States';
import { Mascot } from '@/components/ui/Mascot';
import { cn } from '@/lib/utils';

/**
 * Bốn mức tự đánh giá của thuật toán SM-2.
 *
 * Nhãn cố ý tránh chữ "Sai". Người học thấy mình "sai" liên tục sẽ nản rồi bỏ —
 * mà quên là một phần bình thường của việc ghi nhớ, không phải lỗi lầm. "Quên
 * rồi" mô tả đúng hiện tượng mà không mang tính phán xét.
 */
const RATINGS: { value: SrsRating; label: string; hint: string; className: string }[] = [
  { value: 1, label: 'Quên rồi', hint: 'Cần học lại từ đầu', className: 'bg-beni hover:brightness-95' },
  { value: 2, label: 'Khó', hint: 'Nhớ ra nhưng chật vật', className: 'bg-yamabuki-600 hover:bg-yamabuki-700' },
  { value: 3, label: 'Được', hint: 'Nhớ bình thường', className: 'bg-matcha-600 hover:bg-matcha-700' },
  { value: 4, label: 'Dễ', hint: 'Nhớ ngay lập tức', className: 'bg-ai-500 hover:bg-ai-600' },
];

const TYPE_LABEL: Record<string, string> = {
  kana: 'Bảng chữ cái',
  kanji: 'Kanji',
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
};

const DIRECTION_LABEL: Record<string, string> = {
  recognition: 'Nhìn chữ — nhớ nghĩa',
  recall: 'Nhớ nghĩa — viết chữ',
  handwriting: 'Luyện viết',
};

export default function ReviewPage() {
  const { data: queue, error, isLoading, reload } = useApi<SrsQueue>('/srs/queue?limit=30');

  // Bản sao cục bộ để đi hết lượt mà không phải gọi lại API sau mỗi thẻ
  const [cards, setCards] = useState<SrsQueueCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [session, setSession] = useState({ done: 0, xp: 0 });
  const [lastResult, setLastResult] = useState<SrsReviewResult | null>(null);

  /**
   * Nạp lượt ôn mới khi API trả về hàng chờ khác.
   *
   * Điều chỉnh ngay trong lúc render — đây là cách React khuyến nghị để đồng bộ
   * state theo dữ liệu bên ngoài. Làm việc này trong useEffect sẽ khiến người
   * dùng thấy thoáng một khung hình với dữ liệu cũ trước khi state kịp cập nhật,
   * và React Compiler cũng chặn vì lý do đó.
   */
  const [syncedQueue, setSyncedQueue] = useState<SrsQueue | null>(null);
  if (queue && queue !== syncedQueue) {
    setSyncedQueue(queue);
    setCards(queue.items);
    setIndex(0);
    setRevealed(false);
    setSession({ done: 0, xp: 0 });
  }

  const current = cards[index] ?? null;
  const finished = cards.length > 0 && index >= cards.length;

  const rate = useCallback(
    async (rating: SrsRating) => {
      if (!current || submitting) return;
      setSubmitting(true);
      setReviewError(null);
      try {
        const result = await api.post<SrsReviewResult>('/srs/review', {
          cardId: current.cardId,
          rating,
        });
        setSession((s) => ({ done: s.done + 1, xp: s.xp + result.xpAwarded }));
        setLastResult(result);
        setIndex((i) => i + 1);
        setRevealed(false);
      } catch {
        setReviewError('Không ghi nhận được kết quả. Kiểm tra kết nối rồi thử lại.');
      } finally {
        setSubmitting(false);
      }
    },
    [current, submitting],
  );

  /**
   * Phím tắt: Space/Enter lật thẻ, 1–4 chấm điểm.
   *
   * Người ôn vài chục thẻ mỗi ngày trên máy tính nhanh hơn hẳn khi không phải
   * rời tay khỏi bàn phím. Chỉ gắn khi đang có thẻ, và bỏ qua khi con trỏ đang
   * nằm trong ô nhập để không cướp phím của người dùng.
   */
  useEffect(() => {
    if (!current) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        return;
      }
      if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        void rate(Number(e.key) as SrsRating);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, rate]);

  if (isLoading) return <Spinner label="Đang chuẩn bị thẻ ôn tập..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  // ---- Bộ thẻ trống ----
  if (!queue || queue.items.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <Card>
          <EmptyState
            icon={<Mascot pose="cheer" className="h-20 w-20" />}
            title="Chưa có gì để ôn"
            body="Bộ ôn tập của bạn đang trống. Sang trang Học bài, chọn vài chữ cái rồi thêm vào bộ ôn — hệ thống sẽ tự nhắc bạn ôn đúng lúc."
            action={
              <Link href="/hoc">
                <Button>Chọn chữ để học</Button>
              </Link>
            }
          />
        </Card>
        <SrsSummary />
      </div>
    );
  }

  // ---- Hết lượt ----
  if (finished) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <Card className="text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-yamabuki-500" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold text-sumi">Xong lượt ôn rồi!</h2>
          <p className="mt-1 text-sumi-muted">
            Bạn đã ôn {session.done} thẻ và nhận {session.xp} XP. お疲れさま！
          </p>

          {lastResult?.streak.message && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yamabuki-50 px-3 py-1 text-sm font-medium text-yamabuki-700">
              <Flame className="h-4 w-4" aria-hidden="true" />
              {lastResult.streak.message}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reload}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Ôn tiếp
            </Button>
            <Link href="/hoc">
              <Button variant="outline">Học chữ mới</Button>
            </Link>
          </div>
        </Card>
        <SrsSummary />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader />

      {queue.backlogWarning && queue.backlogMessage && (
        <Alert tone="warning">{queue.backlogMessage}</Alert>
      )}
      {reviewError && <Alert tone="error">{reviewError}</Alert>}

      <div>
        <div className="mb-2 flex items-center justify-between text-sm text-sumi-muted">
          <span>
            Thẻ {index + 1} / {cards.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {session.xp} XP lượt này
          </span>
        </div>
        <ProgressBar percent={(index / cards.length) * 100} label="Tiến độ lượt ôn" />
      </div>

      {current && (
        <ReviewCard
          card={current}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onRate={rate}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <header>
      <h1 className="text-2xl font-bold text-sumi">Ôn tập</h1>
      <p className="mt-1 text-sumi-muted">
        Ôn đúng lúc sắp quên là cách nhớ lâu nhất mà tốn ít sức nhất.
      </p>
    </header>
  );
}

function ReviewCard({
  card,
  revealed,
  onReveal,
  onRate,
  submitting,
}: {
  card: SrsQueueCard;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: SrsRating) => void;
  submitting: boolean;
}) {
  // Chữ Nhật phải để cỡ lớn hơn hẳn chữ Latinh mới nhìn rõ từng nét
  const promptIsJapanese = ['character', 'word', 'pattern'].includes(card.content.promptType);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-sakura-50 px-2.5 py-1 font-medium text-sakura-700">
          {TYPE_LABEL[card.itemType] ?? card.itemType}
        </span>
        <span className="rounded-full bg-black/5 px-2.5 py-1 text-sumi-muted">
          {DIRECTION_LABEL[card.direction] ?? card.direction}
        </span>
        {card.state === 'new' && (
          <span className="rounded-full bg-matcha-50 px-2.5 py-1 font-medium text-matcha-700">
            Mới
          </span>
        )}
        {card.isOverdue && (
          <span className="rounded-full bg-yamabuki-50 px-2.5 py-1 font-medium text-yamabuki-700">
            Quá hạn
          </span>
        )}
      </div>

      <div className="flex min-h-[9rem] items-center justify-center py-6 text-center">
        <p
          className={cn(
            'text-sumi',
            promptIsJapanese ? 'font-jp text-6xl' : 'text-2xl font-semibold',
          )}
        >
          {card.content.prompt}
        </p>
      </div>

      {!revealed ? (
        <div className="text-center">
          <Button size="lg" onClick={onReveal} fullWidth>
            Hiện đáp án
          </Button>
          <p className="mt-2 text-xs text-sumi-muted">
            Cố nhớ lại trước khi lật — chính lúc gắng nhớ mới là lúc trí nhớ được củng cố.
          </p>
        </div>
      ) : (
        <div>
          <div className="rounded-2xl bg-washi p-4 text-center">
            <p className="text-xl font-semibold text-sumi">{card.content.answer}</p>

            {card.content.extra?.sinoVietnamese && (
              <p className="mt-1 font-semibold text-ai-500">
                Âm Hán-Việt: {card.content.extra.sinoVietnamese}
              </p>
            )}
            {card.content.extra?.readings && (
              <p className="mt-1 font-jp text-sm text-sumi-muted">{card.content.extra.readings}</p>
            )}
            {card.content.extra?.reading && (
              <p className="mt-1 font-jp text-sm text-sumi-muted">{card.content.extra.reading}</p>
            )}
            {card.content.extra?.formation && (
              <p className="mt-2 font-jp text-sm text-sumi-muted">{card.content.extra.formation}</p>
            )}
            {card.content.hint && (
              <p className="mt-3 text-sm text-sumi-muted">💡 {card.content.hint}</p>
            )}
          </div>

          <p className="mt-5 text-center text-sm font-medium text-sumi">
            Bạn nhớ chữ này ở mức nào?
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => onRate(r.value)}
                disabled={submitting}
                title={r.hint}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-3 text-white transition',
                  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
                  r.className,
                )}
              >
                <span className="font-semibold">{r.label}</span>
                {/* Cho thấy trước hệ quả: chọn mức này thì bao lâu nữa gặp lại chữ */}
                <span className="text-xs text-white/85">
                  {card.nextIntervals[String(r.value)] ?? ''}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 hidden text-center text-xs text-sumi-muted sm:block">
            Phím tắt: Space lật thẻ · phím 1–4 chấm điểm
          </p>
        </div>
      )}
    </Card>
  );
}

/** Tổng quan bộ thẻ — chỉ hiện khi không đang ôn dở. */
function SrsSummary() {
  const { data } = useApi<SrsStats>('/srs/stats');
  const forecast = useMemo(() => data?.forecast.slice(0, 7) ?? [], [data]);
  const peak = useMemo(() => Math.max(1, ...forecast.map((f) => f.count)), [forecast]);

  if (!data || data.total === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-sumi">Bộ thẻ của bạn</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Tổng số thẻ" value={data.total} />
        <StatTile label="Đến hạn" value={data.due} />
        <StatTile label="Chưa học" value={data.new} />
        <StatTile label="Đang học" value={data.learning} />
      </div>

      {forecast.length > 0 && (
        <Card className="mt-3">
          <h3 className="text-sm font-semibold text-sumi">Số thẻ đến hạn 7 ngày tới</h3>
          <ul className="mt-3 space-y-1.5">
            {forecast.map((f) => (
              <li key={f.date} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-sumi-muted">{formatDay(f.date)}</span>
                <span className="flex-1">
                  <ProgressBar
                    percent={(f.count / peak) * 100}
                    label={`${f.count} thẻ đến hạn ngày ${f.date}`}
                    tone="ai"
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-medium text-sumi">{f.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.leeches > 0 && (
        <Alert tone="info" className="mt-3">
          Có {data.leeches} chữ bạn quên đi quên lại nhiều lần. Đó là chuyện bình thường — hãy
          thử nghĩ một mẹo nhớ khác cho riêng chúng.
        </Alert>
      )}
    </section>
  );
}

function formatDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Ngày mai';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
