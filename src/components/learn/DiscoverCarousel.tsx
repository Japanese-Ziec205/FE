'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { Card } from '@/components/ui/Card';
import type { DiscoverCard } from '@/lib/learn-types';
import { cn } from '@/lib/utils';

/** Thẻ tự đổi sau chừng này. Đủ lâu để đọc hết một mẩu văn hoá ngắn. */
const ROTATE_MS = 9_000;

const TONE: Record<DiscoverCard['kind'], string> = {
  recall: 'from-ai-50 to-white',
  culture: 'from-sakura-50 to-white',
  kotowaza: 'from-yamabuki-50 to-white',
};

/**
 * Khối nội dung tự đổi ở trang chính, thay cho bản đồ lộ trình cũ.
 *
 * Bản đồ lộ trình N5→N1 chỉ nói được một điều duy nhất — "bạn đang ở N5" — và
 * nó không đổi suốt hàng tháng trời, nên chiếm chỗ đẹp nhất của trang mà không
 * mang lại gì. Khối này dùng cùng khoảng không gian đó để nhắc lại chữ người
 * học đã gặp và kể một mẩu văn hoá Nhật, mỗi lần mở trang lại thấy khác.
 */
export function DiscoverCarousel() {
  const { data, isLoading } = useApi<DiscoverCard[]>('/discover?limit=10');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const cards = data ?? [];
  const total = cards.length;

  const go = useCallback(
    (delta: number) => {
      if (total === 0) return;
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );

  /*
   * Dừng khi người dùng đang tương tác.
   *
   * Chữ tự trôi mất giữa lúc đang đọc là lỗi trải nghiệm kinh điển của mọi
   * carousel. Rê chuột vào, focus bằng bàn phím, hoặc chuyển sang tab khác đều
   * làm dừng vòng quay.
   */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (paused || total <= 1) return;

    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % total), ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, total]);

  // Người dùng cài "giảm chuyển động" trong hệ điều hành thì không tự đổi nữa
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setPaused((p) => p || query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  if (isLoading) {
    return <Card className="h-44 animate-pulse bg-black/5" aria-hidden="true" />;
  }
  if (total === 0) return null;

  const card = cards[Math.min(index, total - 1)];

  const inner = (
    <>
      <div className="flex items-start gap-4">
        <span className="text-3xl leading-none" aria-hidden="true">
          {card.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sumi-muted">
            {card.eyebrow}
          </p>
          <p className="mt-1 font-jp text-2xl font-bold text-sumi">{card.title}</p>
          {card.reading && <p className="mt-0.5 text-sm text-sumi-muted">{card.reading}</p>}
          <p className="mt-2 text-sumi">{card.body}</p>
        </div>
      </div>
    </>
  );

  return (
    <section
      aria-roledescription="băng chuyền"
      aria-label="Nhắc lại kiến thức và văn hoá Nhật Bản"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Card className={cn('relative bg-gradient-to-br', TONE[card.kind])}>
        {/*
          aria-live="polite" để trình đọc màn hình đọc nội dung mới khi thẻ đổi,
          nhưng không ngắt lời người dùng đang nghe thứ khác.
        */}
        <div aria-live="polite" aria-atomic="true">
          {card.href ? (
            <Link href={card.href} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sakura-400">
              {inner}
            </Link>
          ) : (
            inner
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Chọn thẻ">
            {cards.map((c, i) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Thẻ ${i + 1} trên ${total}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-sakura-500' : 'w-2 bg-black/15 hover:bg-black/30',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {paused && (
              <Pause className="mr-1 h-3.5 w-3.5 text-sumi-muted" aria-label="Đang tạm dừng" />
            )}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Thẻ trước"
              className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-xl text-sumi-muted hover:bg-black/5"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Thẻ tiếp theo"
              className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-xl text-sumi-muted hover:bg-black/5"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
