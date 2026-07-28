'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  Flame,
  PartyPopper,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi, useAction } from '@/hooks/useApi';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import { useEntitlements } from '@/hooks/useEntitlements';
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

/**
 * Suy ra mức tự đánh giá SM-2 từ kết quả trắc nghiệm và thời gian trả lời.
 *
 * Sai thì luôn là mức 1: hỏi "bạn nhớ tới đâu" sau khi vừa chọn nhầm là vô
 * nghĩa. Đúng thì dùng thời gian làm thước đo độ vững của trí nhớ — nhớ ngay
 * lập tức khác hẳn với phải ngồi loại trừ từng phương án, và SM-2 cần biết
 * khác biệt đó để giãn lịch ôn cho đúng.
 *
 * Các mốc lấy theo tài liệu về tốc độ truy xuất trí nhớ: dưới 4 giây là gần
 * như tự động, trên 10 giây gần như chắc chắn đã phải suy luận.
 */
function ratingFor(correct: boolean, elapsedMs: number): SrsRating {
  if (!correct) return 1;
  if (elapsedMs < 4_000) return 4;
  if (elapsedMs < 10_000) return 3;
  return 2;
}

const RATING_LABEL: Record<SrsRating, string> = {
  1: 'Quên rồi',
  2: 'Khó',
  3: 'Được',
  4: 'Dễ',
};

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

/**
 * Nhắc số lượt ôn còn lại của gói miễn phí.
 *
 * Chỉ hiện khi sắp hết (từ 10 lượt trở xuống). Đếm ngược ngay từ lượt đầu tiên
 * biến việc học thành cuộc chạy đua với hạn mức — đúng thứ nên tránh với người
 * đang cố gắng duy trì thói quen.
 */
function FreeQuotaNotice() {
  const { isPremium, reviewsRemaining, reviewLimit } = useEntitlements();

  if (isPremium || reviewsRemaining === null || reviewLimit === null) return null;
  if (reviewsRemaining > 10) return null;

  if (reviewsRemaining <= 0) {
    return (
      <Alert tone="warning" title="Hết lượt ôn hôm nay">
        Gói miễn phí có {reviewLimit} thẻ mỗi ngày. Lượt mới được cấp lại vào ngày mai —{' '}
        <Link href="/goi-hoc" className="font-semibold underline">
          hoặc nâng gói để ôn không giới hạn
        </Link>
        .
      </Alert>
    );
  }

  return (
    <Alert tone="info">
      Còn <strong>{reviewsRemaining}</strong> lượt ôn trong hôm nay (gói miễn phí có{' '}
      {reviewLimit} thẻ/ngày).
    </Alert>
  );
}

export default function ReviewPage() {
  const { data: queue, error, isLoading, reload } = useApi<SrsQueue>('/srs/queue?limit=30');

  // Ghi nhận giờ học suốt thời gian ở trang này
  useStudyTracker('srs');

  // Bản sao cục bộ để đi hết lượt mà không phải gọi lại API sau mỗi thẻ
  const [cards, setCards] = useState<SrsQueueCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  /**
   * Hai cách ôn, người học tự chọn và hệ thống nhớ lựa chọn.
   *
   * `quiz` — trắc nghiệm 4 lựa chọn, chấm ngay, nhanh và hợp với người mới.
   * `flip` — thẻ lật tự chấm, buộc phải nhớ lại từ đầu nên củng cố trí nhớ tốt
   * hơn, nhưng đòi hỏi người học trung thực với chính mình.
   */
  const [mode, setMode] = useState<'quiz' | 'flip'>('quiz');
  const [picked, setPicked] = useState<string | null>(null);
  /**
   * Mức SM-2 suy ra tại đúng thời điểm bấm chọn.
   *
   * Tính ngay trong handler rồi lưu lại, không tính lúc render: thời gian trôi
   * liên tục nên render lại sẽ cho ra mức khác, và Date.now() lúc render là hàm
   * không thuần khiết.
   */
  const [appliedRating, setAppliedRating] = useState<SrsRating | null>(null);
  // Mốc bắt đầu xem thẻ, để suy ra mức độ thành thạo từ thời gian trả lời
  const shownAtRef = useRef<number>(0);
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
    setPicked(null);
    setAppliedRating(null);
    setSession({ done: 0, xp: 0 });
  }

  const current = cards[index] ?? null;
  const finished = cards.length > 0 && index >= cards.length;

  /** Ghi nhận lựa chọn và chốt luôn mức đánh giá tương ứng. */
  const pick = useCallback(
    (choice: string) => {
      if (!current || picked !== null) return;
      const elapsed = shownAtRef.current
        ? Date.now() - shownAtRef.current
        : Number.POSITIVE_INFINITY;
      setPicked(choice);
      setAppliedRating(ratingFor(choice === current.content.answer, elapsed));
    },
    [current, picked],
  );

  /**
   * Đặt lại mốc thời gian mỗi khi sang thẻ khác.
   *
   * Dùng ref chứ không phải state: giá trị này chỉ để đọc lúc gửi kết quả, cập
   * nhật nó không cần vẽ lại gì. Ghi trong effect vì Date.now() là hàm không
   * thuần khiết, gọi lúc render sẽ bị React Compiler chặn.
   */
  useEffect(() => {
    if (current) shownAtRef.current = Date.now();
  }, [current]);

  const rate = useCallback(
    async (rating: SrsRating) => {
      if (!current || submitting) return;
      setSubmitting(true);
      setReviewError(null);
      try {
        const result = await api.post<SrsReviewResult>('/srs/review', {
          cardId: current.cardId,
          rating,
          // Thời gian trả lời là tín hiệu thật về độ vững của trí nhớ; backend
          // dùng nó cho thống kê, và chế độ trắc nghiệm dùng để tự chấm mức.
          responseMs: shownAtRef.current
            ? Math.min(600_000, Date.now() - shownAtRef.current)
            : 0,
        });
        setSession((s) => ({ done: s.done + 1, xp: s.xp + result.xpAwarded }));
        setLastResult(result);
        setIndex((i) => i + 1);
        setRevealed(false);
        setPicked(null);
        setAppliedRating(null);
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

      const quiz = mode === 'quiz' && current.choices;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        // Ở chế độ trắc nghiệm, Space chỉ dùng để đi tiếp SAU khi đã chọn
        if (quiz) {
          if (appliedRating !== null) void rate(appliedRating);
          return;
        }
        if (!revealed) setRevealed(true);
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        const n = Number(e.key);
        e.preventDefault();
        if (quiz) {
          // 1–4 chọn phương án tương ứng, chỉ khi chưa chọn
          const choice = current.choices![n - 1];
          if (choice !== undefined) pick(choice);
          return;
        }
        if (revealed) void rate(n as SrsRating);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, rate, mode, appliedRating, pick]);

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
      <FreeQuotaNotice />

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

      {/* Chọn cách ôn. Chỉ hiện khi thẻ hiện tại có sẵn bộ lựa chọn. */}
      {current?.choices && (
        <div role="radiogroup" aria-label="Cách ôn tập" className="flex gap-2">
          {([
            ['quiz', 'Trắc nghiệm'],
            ['flip', 'Thẻ lật'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              role="radio"
              aria-checked={mode === id}
              onClick={() => {
                setMode(id);
                setPicked(null);
                setRevealed(false);
              }}
              className={cn(
                'rounded-xl px-3 py-1.5 text-sm font-medium transition',
                mode === id
                  ? 'bg-sumi text-white'
                  : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-black/[0.03]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {current &&
        (mode === 'quiz' && current.choices ? (
          <QuizCard
            card={current}
            choices={current.choices}
            picked={picked}
            appliedRating={appliedRating}
            onPick={pick}
            onNext={() => appliedRating !== null && rate(appliedRating)}
            submitting={submitting}
          />
        ) : (
          <ReviewCard
            card={current}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onRate={rate}
            submitting={submitting}
          />
        ))}
    </div>
  );
}

/**
 * Thẻ trắc nghiệm bốn lựa chọn.
 *
 * Chọn xong là biết đúng sai ngay, không có bước "kiểm tra đáp án" riêng. Phản
 * hồi tức thì giúp trí nhớ gắn kết quả với chữ vừa nhìn; để trễ vài giây là mất
 * phần lớn tác dụng đó.
 */
function QuizCard({
  card,
  choices,
  picked,
  appliedRating,
  onPick,
  onNext,
  submitting,
}: {
  card: SrsQueueCard;
  choices: string[];
  picked: string | null;
  appliedRating: SrsRating | null;
  onPick: (value: string) => void;
  onNext: () => void;
  submitting: boolean;
}) {
  const answered = picked !== null;
  const correct = picked === card.content.answer;
  const promptIsJapanese = ['character', 'word', 'pattern'].includes(card.content.promptType);
  // Đáp án là chữ Nhật khi đề bài là romaji hoặc nghĩa tiếng Việt
  const answersAreJapanese = ['romaji', 'meaning'].includes(card.content.promptType);

  return (
    <Card className="p-6">
      <CardBadges card={card} />

      <div className="flex min-h-[8rem] items-center justify-center py-5 text-center">
        <p
          className={cn(
            'text-sumi',
            promptIsJapanese ? 'font-jp text-6xl' : 'text-2xl font-semibold',
          )}
        >
          {card.content.prompt}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((choice, i) => {
          const isAnswer = choice === card.content.answer;
          const isPicked = choice === picked;

          return (
            <button
              key={choice}
              onClick={() => !answered && onPick(choice)}
              disabled={answered}
              className={cn(
                'flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition',
                !answered && 'border-[#E8E2D9] hover:border-sakura-300 hover:bg-sakura-50',
                // Sau khi trả lời: LUÔN tô xanh đáp án đúng, kể cả khi người học
                // chọn sai — nhìn thấy đáp án đúng là phần quan trọng nhất.
                answered && isAnswer && 'border-matcha-500 bg-matcha-50',
                answered && isPicked && !isAnswer && 'border-beni bg-sakura-50',
                answered && !isAnswer && !isPicked && 'border-[#E8E2D9] opacity-50',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  answered && isAnswer
                    ? 'bg-matcha-500 text-white'
                    : answered && isPicked
                      ? 'bg-beni text-white'
                      : 'bg-black/5 text-sumi-muted',
                )}
                aria-hidden="true"
              >
                {answered && isAnswer ? (
                  <Check className="h-4 w-4" />
                ) : answered && isPicked ? (
                  <X className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'min-w-0 flex-1 text-sumi',
                  answersAreJapanese ? 'font-jp text-2xl' : 'text-base',
                )}
              >
                {choice}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-5">
          <p
            className={cn(
              'text-center text-lg font-semibold',
              correct ? 'text-matcha-700' : 'text-beni',
            )}
            role="status"
          >
            {correct ? 'Chính xác!' : `Đáp án đúng: ${card.content.answer}`}
          </p>

          {/* Thông tin bổ trợ chỉ hiện SAU khi trả lời, để không thành gợi ý */}
          {(card.content.extra?.sinoVietnamese ||
            card.content.extra?.readings ||
            card.content.extra?.reading ||
            card.content.hint) && (
            <div className="mt-3 rounded-2xl bg-washi p-3 text-center text-sm">
              {card.content.extra?.sinoVietnamese && (
                <p className="font-semibold text-ai-500">
                  Âm Hán-Việt: {card.content.extra.sinoVietnamese}
                </p>
              )}
              {card.content.extra?.readings && (
                <p className="mt-1 font-jp text-sumi-muted">{card.content.extra.readings}</p>
              )}
              {card.content.extra?.reading && (
                <p className="mt-1 font-jp text-sumi-muted">{card.content.extra.reading}</p>
              )}
              {card.content.hint && (
                <p className="mt-2 text-sumi-muted">💡 {card.content.hint}</p>
              )}
            </div>
          )}

          {/*
            Nói rõ hệ thống chấm mình mức nào và bao giờ gặp lại. Chấm ngầm rồi
            im lặng khiến người học không hiểu vì sao có chữ tuần sau mới hiện
            lại, có chữ vài phút đã quay lại.
          */}
          {appliedRating !== null && (
            <p className="mt-3 text-center text-sm text-sumi-muted">
              Ghi nhận mức <strong className="text-sumi">{RATING_LABEL[appliedRating]}</strong>
              {card.nextIntervals[String(appliedRating)] && (
                <> · gặp lại sau {card.nextIntervals[String(appliedRating)]}</>
              )}
            </p>
          )}

          <Button className="mt-4" fullWidth size="lg" onClick={onNext} isLoading={submitting}>
            Thẻ tiếp theo
          </Button>
          <p className="mt-2 hidden text-center text-xs text-sumi-muted sm:block">
            Phím tắt: 1–4 chọn phương án · Space sang thẻ tiếp
          </p>
        </div>
      )}

      {!answered && (
        <p className="mt-4 hidden text-center text-xs text-sumi-muted sm:block">
          Phím tắt: bấm 1–4 để chọn nhanh
        </p>
      )}
    </Card>
  );
}

/** Nhãn loại thẻ, hướng ôn và trạng thái — dùng chung cho cả hai chế độ. */
function CardBadges({ card }: { card: SrsQueueCard }) {
  return (
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
      <CardBadges card={card} />

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

      {data.leeches > 0 && <LeechPanel count={data.leeches} />}
    </section>
  );
}

/**
 * Danh sách thẻ "khó nhằn".
 *
 * Backend đánh dấu một thẻ là leech khi người học quên nó quá 8 lần. Cách xử lý
 * đúng KHÔNG phải là ép ôn thêm — lặp lại một cách ghi nhớ đã thất bại tám lần
 * thì lần thứ chín cũng thất bại. Cần đổi cách tiếp cận, hoặc tạm gác lại.
 * Nút "học lại từ đầu" đưa thẻ về trạng thái mới để bắt đầu lại nhẹ nhàng.
 */
function LeechPanel({ count }: { count: number }) {
  const { data, isLoading, reload } = useApi<SrsQueueCard[]>('/srs/leeches');
  const [open, setOpen] = useState(false);

  const reset = useAction(async (cardId: string) => {
    const result = await api.post(`/srs/cards/${cardId}/reset`);
    reload();
    return result;
  });

  return (
    <Card className="mt-3">
      <div className="flex flex-wrap items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yamabuki-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sumi">{count} chữ đang làm khó bạn</p>
          <p className="mt-0.5 text-sm text-sumi-muted">
            Bạn quên đi quên lại chúng nhiều lần. Đó là chuyện bình thường và không có nghĩa
            là bạn kém — chỉ là cách nhớ hiện tại chưa hợp với những chữ này.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ẩn danh sách' : 'Xem danh sách'}
        </Button>
      </div>

      {open && (
        <div className="mt-4">
          {isLoading ? (
            <Spinner label="Đang tải..." />
          ) : (
            <ul className="space-y-2">
              {(data ?? []).map((card) => (
                <li
                  key={card.cardId}
                  className="flex items-center gap-3 rounded-xl bg-washi px-3 py-2"
                >
                  <span className="font-jp text-xl text-sumi">{card.content.prompt}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-sumi-muted">
                    {card.content.answer}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reset.run(card.cardId)}
                    disabled={reset.isRunning}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Học lại từ đầu
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {reset.error && (
            <Alert tone="error" className="mt-2">
              {reset.error}
            </Alert>
          )}
        </div>
      )}
    </Card>
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
