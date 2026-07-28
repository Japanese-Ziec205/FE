'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Flame, Map, PenLine, RefreshCw, Timer, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { DiscoverCarousel } from '@/components/learn/DiscoverCarousel';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api-client';
import { greetingByHour } from '@/lib/utils';
import type { UserStats } from '@/lib/types';
import type { Kotowaza } from '@/lib/learn-types';
import { useApi } from '@/hooks/useApi';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<UserStats>('/users/me/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const greeting = greetingByHour();
  const goalMinutes = stats?.dailyGoalMinutes ?? 10;
  const currentLevel = stats?.currentLevelCode ?? user?.currentLevelCode ?? 'N5';

  return (
    <div className="space-y-5">
      {/* ---------- Lời chào ---------- */}
      <Card className="flex items-center justify-between gap-4 bg-gradient-to-br from-white to-sakura-50">
        <div className="min-w-0">
          <p className="text-jp text-lg text-sakura-600">{greeting.jp}</p>
          <h1 className="mt-1 truncate text-2xl font-bold text-sumi">
            {greeting.vi}, {user?.displayName}!
          </h1>
          <p className="mt-1 text-sumi-muted">
            {stats?.streak.current
              ? `Bạn đang có chuỗi ${stats.streak.current} ngày. Giữ nhịp nhé!`
              : 'Hôm nay là ngày tuyệt vời để bắt đầu.'}
          </p>
        </div>
        <Mascot pose="wave" className="hidden h-24 w-24 shrink-0 sm:block" />
      </Card>

      {/* ---------- Ba chỉ số chính ---------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yamabuki-50 text-yamabuki-600">
              <Flame className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-sumi">
                {loading ? '—' : stats?.streak.current ?? 0}
              </p>
              <p className="text-sm text-sumi-muted">ngày liên tiếp</p>
            </div>
          </div>
          {!!stats?.streak.freezesAvailable && (
            <p className="mt-3 text-xs text-sumi-muted">
              🛡️ Còn {stats.streak.freezesAvailable} bùa cứu chuỗi
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai-50 text-ai-600">
              <Timer className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-sumi">
                {loading ? '—' : stats?.totals.studyHours ?? 0}
              </p>
              <p className="text-sm text-sumi-muted">giờ đã học</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-sumi-muted">
            Mục tiêu {goalMinutes} phút mỗi ngày · Cấp {currentLevel} cần 250–400 giờ
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sakura-50 text-sakura-600">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-sumi">
                {loading ? '—' : `Cấp ${stats?.xp.level ?? 1}`}
              </p>
              <p className="text-sm text-sumi-muted">{stats?.xp.levelTitle ?? 'Hạt giống 🌱'}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-[#E8E2D9]">
              <div
                className="h-full rounded-full bg-sakura-500 transition-all"
                style={{ width: `${stats?.xp.progressPercent ?? 0}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-sumi-muted">
              {stats ? `${stats.xp.intoLevel}/${stats.xp.neededForNextLevel} XP` : '0 XP'}
            </p>
          </div>
        </Card>
      </div>

      {/*
        Khối tự đổi, thay cho bản đồ lộ trình N5→N1 trước đây.

        Bản đồ cũ chỉ nói được đúng một điều — "bạn đang ở N5" — và không đổi
        suốt hàng tháng, trong khi chiếm chỗ đẹp nhất của trang. Cấp độ hiện tại
        vẫn hiện ở ô "giờ đã học" phía trên và ở trang cấp độ.
      */}
      <DiscoverCarousel />

      {/* ---------- Việc hôm nay ---------- */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-sumi">Hôm nay học gì?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TaskCard
            href="/on-tap"
            icon={<RefreshCw className="h-6 w-6" aria-hidden="true" />}
            tone="sakura"
            title="Ôn tập"
            body="Ôn lại những gì sắp quên — ưu tiên số một mỗi ngày."
          />
          <TaskCard
            href="/hoc"
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            tone="ai"
            title="Học bài mới"
            body="Bảng chữ cái Hiragana, Katakana và Kanji cơ bản."
          />
          <TaskCard
            href="/luyen-viet"
            icon={<PenLine className="h-6 w-6" aria-hidden="true" />}
            tone="matcha"
            title="Luyện viết"
            body="Viết tay trên màn hình, chấm từng nét bút."
          />
          <TaskCard
            href={`/cap-do/${currentLevel}`}
            icon={<Map className="h-6 w-6" aria-hidden="true" />}
            tone="yamabuki"
            title={`Kiến thức ${currentLevel}`}
            body="Toàn bộ từ vựng, Hán tự, ngữ pháp và đề thi thử của cấp này."
          />
        </div>
      </div>

      {/* ---------- Tục ngữ hôm nay ---------- */}
      <DailyKotowaza />
    </div>
  );
}

/**
 * Tục ngữ của ngày, lấy từ máy chủ.
 *
 * Trước đây câu này bị viết cứng trong mã, nên mọi người mở trang đều thấy đúng
 * một câu suốt nhiều tháng — mất hẳn ý nghĩa "mỗi ngày một câu". Kho tục ngữ
 * nằm trong CMS nên ban biên soạn thêm câu mới mà không cần lập trình viên.
 */
function DailyKotowaza() {
  const { data } = useApi<Kotowaza>('/public/kotowaza/daily');
  if (!data) return null;

  return (
    <Card className="bg-gradient-to-br from-sakura-50 to-yamabuki-50 text-center">
      <p className="font-jp text-xl font-bold text-ai-500">{data.japanese}</p>
      <p className="mt-1 font-jp text-sm text-sumi-muted">{data.reading}</p>
      <p className="mt-3 font-medium text-sumi">{data.meaningVi}</p>
      {data.vietnameseEquivalent && (
        <p className="mt-1 text-sm text-sumi-muted">
          Tục ngữ Việt tương đương: {data.vietnameseEquivalent}
        </p>
      )}
    </Card>
  );
}

const TONES = {
  sakura: 'bg-sakura-50 text-sakura-600',
  ai: 'bg-ai-50 text-ai-600',
  matcha: 'bg-matcha-50 text-matcha-700',
  yamabuki: 'bg-yamabuki-50 text-yamabuki-700',
} as const;

function TaskCard({
  href,
  icon,
  tone,
  title,
  body,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  title: string;
  body: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="card block p-5 transition hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONES[tone]}`}>
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-[#EFEAE3] px-2.5 py-1 text-xs font-medium text-sumi-muted">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-semibold text-sumi">{title}</h3>
      <p className="mt-1 text-sm text-sumi-muted">{body}</p>
    </Link>
  );
}
