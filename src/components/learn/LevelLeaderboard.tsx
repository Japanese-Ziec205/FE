'use client';

import { useMemo, useState } from 'react';
import { Crown, EyeOff, Medal } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/States';
import { JLPT_LEVELS, type JlptLevel } from '@/lib/jlpt-levels';
import type { Leaderboard, LeaderboardEntry } from '@/lib/learn-types';
import { cn } from '@/lib/utils';

/** Ba hạng đầu được tô màu; từ hạng 4 trở đi chỉ hiện số. */
const PODIUM: Record<number, string> = {
  1: 'bg-yamabuki-100 text-yamabuki-800',
  2: 'bg-ai-50 text-ai-600',
  3: 'bg-sakura-50 text-sakura-700',
};

export function LevelLeaderboard({ defaultLevel }: { defaultLevel: JlptLevel }) {
  const [level, setLevel] = useState<JlptLevel>(defaultLevel);
  const board = useApi<Leaderboard>(`/gamification/leaderboard?level=${level}&limit=20`);

  const meInPage = useMemo(
    () => board.data?.entries.some((e) => e.isMe) ?? false,
    [board.data],
  );

  return (
    <section>
      <CardHeader
        title="Bảng xếp hạng"
        subtitle="Xếp theo số chữ đã học được. Mỗi cấp độ có bảng riêng — bạn chỉ đứng cạnh những người đang học cùng cấp với mình."
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Chọn cấp độ">
        {JLPT_LEVELS.map((code) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={level === code}
            onClick={() => setLevel(code)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition',
              level === code
                ? 'bg-sakura-500 text-white'
                : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-sakura-50',
            )}
          >
            {code}
          </button>
        ))}
      </div>

      {board.isLoading ? (
        <Spinner label="Đang tải bảng xếp hạng..." />
      ) : board.error ? (
        <ErrorState message={board.error} onRetry={board.reload} />
      ) : board.data && board.data.entries.length === 0 ? (
        <Card className="py-10 text-center text-sumi-muted">
          Chưa có ai học ở cấp {level}. Học vài chữ là bạn thành người đầu tiên trên bảng.
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-[#E8E2D9]">
            {board.data?.entries.map((entry) => (
              <Row key={entry.userId} entry={entry} />
            ))}
          </ul>

          {/*
            Vị trí của chính người dùng khi họ nằm ngoài trang đang xem.
            Người đứng thứ 340 vẫn cần thấy mình ở đâu — không thấy gì cả thì
            bảng xếp hạng chỉ còn là nơi tôn vinh vài người đứng đầu.
          */}
          {board.data?.me && !meInPage && (
            <div className="border-t-2 border-dashed border-[#E8E2D9]">
              <ul>
                <Row entry={board.data.me} />
              </ul>
            </div>
          )}
        </Card>
      )}

      <p className="mt-3 flex items-start gap-2 text-sm text-sumi-muted">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Không muốn xuất hiện ở đây? Tắt mục &ldquo;hiện tên trên bảng xếp hạng&rdquo; trong Hồ sơ
        là bạn được gỡ khỏi bảng hoàn toàn.
      </p>
    </section>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  const podium = PODIUM[entry.rank];

  return (
    <li
      className={cn(
        'flex items-center gap-3 px-4 py-3 sm:px-5',
        entry.isMe && 'bg-sakura-50/70',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
          podium ?? 'bg-[#EFEAE3] text-sumi-muted',
        )}
        aria-hidden="true"
      >
        {entry.rank === 1 ? (
          <Crown className="h-5 w-5" />
        ) : entry.rank <= 3 ? (
          <Medal className="h-4 w-4" />
        ) : (
          entry.rank
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sumi">
          <span className="sr-only">Hạng {entry.rank}: </span>
          {entry.displayName}
          {entry.isMe && (
            <span className="ml-2 rounded-full bg-sakura-500 px-2 py-0.5 text-xs font-semibold text-white">
              Bạn
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-sumi-muted">
          {entry.breakdown.kana} kana · {entry.breakdown.kanji} Hán tự ·{' '}
          {entry.breakdown.vocabulary} từ · {entry.breakdown.grammar} ngữ pháp
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-bold text-sumi">{entry.score.toLocaleString('vi-VN')}</p>
        <p className="text-xs text-sumi-muted">🔥 {entry.streak} ngày</p>
      </div>
    </li>
  );
}
