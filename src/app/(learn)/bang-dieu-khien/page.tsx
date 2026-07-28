'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Flame, Lock, PenLine, RefreshCw, Timer, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api-client';
import { greetingByHour } from '@/lib/utils';
import type { UserStats } from '@/lib/types';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

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

      {/* ---------- Bản đồ lộ trình ---------- */}
      <Card>
        <h2 className="text-lg font-semibold text-sumi">Lộ trình của bạn</h2>
        <p className="mt-1 text-sm text-sumi-muted">
          Hoàn thành cấp hiện tại để mở khoá cấp tiếp theo.
        </p>

        <ol className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
          {LEVELS.map((code) => {
            const isCurrent = code === currentLevel;
            const isUnlocked = LEVELS.indexOf(code) <= LEVELS.indexOf(currentLevel);
            return (
              <li key={code} className="flex shrink-0 items-center gap-2">
                <div className="text-center">
                  <div
                    className={[
                      'flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold transition',
                      isCurrent
                        ? 'bg-sakura-500 text-white ring-4 ring-sakura-200'
                        : isUnlocked
                          ? 'bg-matcha-100 text-matcha-800'
                          : 'bg-[#EFEAE3] text-sumi-muted',
                    ].join(' ')}
                  >
                    {isUnlocked ? code : <Lock className="h-5 w-5" aria-hidden="true" />}
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-sumi-muted">
                    {isCurrent ? 'Đang học' : isUnlocked ? code : code}
                  </p>
                </div>
                {code !== 'N1' && <div className="h-0.5 w-6 rounded bg-[#E8E2D9]" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* ---------- Việc hôm nay ---------- */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-sumi">Hôm nay học gì?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TaskCard
            href="/on-tap"
            icon={<RefreshCw className="h-6 w-6" aria-hidden="true" />}
            tone="sakura"
            title="Ôn tập"
            body="Ôn lại những gì sắp quên — ưu tiên số một mỗi ngày."
            badge="Sắp có"
          />
          <TaskCard
            href="/hoc"
            icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
            tone="ai"
            title="Học bài mới"
            body="Bảng chữ cái Hiragana, Katakana và Kanji cơ bản."
            badge="Sắp có"
          />
          <TaskCard
            href="/luyen-viet"
            icon={<PenLine className="h-6 w-6" aria-hidden="true" />}
            tone="matcha"
            title="Luyện viết"
            body="Viết tay trên màn hình, chấm từng nét bút."
            badge="Sắp có"
          />
        </div>
      </div>

      {/* ---------- Kotowaza ---------- */}
      <Card className="bg-gradient-to-br from-sakura-50 to-yamabuki-50 text-center">
        <p className="text-jp text-xl font-bold text-ai-600">継続は力なり</p>
        <p className="mt-1 text-sm text-sumi-muted">keizoku wa chikara nari</p>
        <p className="mt-3 font-medium text-sumi">Kiên trì chính là sức mạnh</p>
      </Card>
    </div>
  );
}

const TONES = {
  sakura: 'bg-sakura-50 text-sakura-600',
  ai: 'bg-ai-50 text-ai-600',
  matcha: 'bg-matcha-50 text-matcha-700',
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
