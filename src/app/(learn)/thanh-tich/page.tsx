'use client';

import { useMemo, useState } from 'react';
import { Award, Flame, Lock, Snowflake, Sparkles, Trophy } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import type { Achievement, AchievementTier, GamificationProfile } from '@/lib/learn-types';
import { Card } from '@/components/ui/Card';
import { ErrorState, ProgressBar, Spinner, StatTile } from '@/components/ui/States';
import { cn } from '@/lib/utils';

/**
 * Màu theo bậc huy hiệu.
 *
 * Không dùng màu thật của kim loại (nâu/xám/vàng) vì chúng lệch khỏi bảng màu
 * của dự án và tương phản kém trên nền kem. Đây là bản phối lại theo bảng màu
 * riêng, vẫn giữ được thứ tự cảm nhận đồng < bạc < vàng < bạch kim.
 */
const TIER: Record<AchievementTier, { label: string; ring: string; bg: string; text: string }> = {
  bronze: { label: 'Đồng', ring: 'ring-yamabuki-200', bg: 'bg-yamabuki-50', text: 'text-yamabuki-700' },
  silver: { label: 'Bạc', ring: 'ring-ai-100', bg: 'bg-ai-50', text: 'text-ai-500' },
  gold: { label: 'Vàng', ring: 'ring-yamabuki-300', bg: 'bg-yamabuki-100', text: 'text-yamabuki-800' },
  platinum: { label: 'Bạch kim', ring: 'ring-sakura-200', bg: 'bg-sakura-50', text: 'text-sakura-700' },
};

export default function AchievementsPage() {
  const profile = useApi<GamificationProfile>('/gamification/profile');
  const achievements = useApi<Achievement[]>('/gamification/achievements');
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);

  const grouped = useMemo(() => {
    const list = achievements.data ?? [];
    const visible = onlyUnlocked ? list.filter((a) => a.unlocked) : list;
    const map = new Map<string, Achievement[]>();
    for (const a of visible) {
      const bucket = map.get(a.category) ?? [];
      bucket.push(a);
      map.set(a.category, bucket);
    }
    return [...map.entries()];
  }, [achievements.data, onlyUnlocked]);

  if (profile.isLoading || achievements.isLoading) {
    return <Spinner label="Đang tải thành tích..." />;
  }

  const error = profile.error ?? achievements.error;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          profile.reload();
          achievements.reload();
        }}
      />
    );
  }

  const p = profile.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-sumi">Thành tích</h1>
        <p className="mt-1 text-sumi-muted">
          Mọi con số ở đây chỉ để bạn thấy mình đang tiến bộ — không phải để so với ai khác.
        </p>
      </header>

      {p && (
        <>
          {/* ---------- Cấp độ ---------- */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-sumi-muted">Cấp độ hiện tại</p>
                <p className="text-2xl font-bold text-sumi">
                  Cấp {p.xp.level}
                  <span className="ml-2 text-lg font-semibold text-sakura-600">
                    {p.xp.levelTitle}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-sumi-muted">Tổng XP</p>
                <p className="text-2xl font-bold text-sumi">{p.xp.total.toLocaleString('vi-VN')}</p>
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar
                percent={p.xp.progressPercent}
                label={`Tiến độ lên cấp ${p.xp.level + 1}`}
              />
              <p className="mt-1.5 text-sm text-sumi-muted">
                Còn {(p.xp.neededForNextLevel - p.xp.intoLevel).toLocaleString('vi-VN')} XP nữa
                là lên cấp {p.xp.level + 1}
              </p>
            </div>
          </Card>

          {/* ---------- Số liệu ---------- */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Chuỗi ngày học"
              value={p.streak.current}
              unit="ngày"
              icon={<Flame className="h-4 w-4 text-yamabuki-600" aria-hidden="true" />}
            />
            <StatTile
              label="Chuỗi dài nhất"
              value={p.streak.longest}
              unit="ngày"
              icon={<Trophy className="h-4 w-4 text-sakura-500" aria-hidden="true" />}
            />
            <StatTile
              label="XP hôm nay"
              value={p.xp.today}
              icon={<Sparkles className="h-4 w-4 text-matcha-600" aria-hidden="true" />}
            />
            <StatTile
              label="Huy hiệu"
              value={`${p.achievements.unlocked}/${p.achievements.total}`}
              icon={<Award className="h-4 w-4 text-ai-500" aria-hidden="true" />}
            />
          </div>

          {/*
            Bùa cứu chuỗi ngày. Nói rõ cơ chế thay vì để người dùng tự đoán:
            nghỉ một ngày mà mất sạch chuỗi 60 ngày là lý do rất hay khiến người
            học bỏ hẳn, nên hệ thống có sẵn cơ chế tha thứ.
          */}
          {p.streak.freezesAvailable > 0 && (
            <Card className="flex items-start gap-3 bg-ai-50">
              <Snowflake className="mt-0.5 h-5 w-5 shrink-0 text-ai-500" aria-hidden="true" />
              <div>
                <p className="font-medium text-sumi">
                  Bạn có {p.streak.freezesAvailable} bùa cứu chuỗi
                </p>
                <p className="mt-0.5 text-sm text-sumi-muted">
                  Lỡ nghỉ một ngày, bùa sẽ tự dùng để giữ chuỗi cho bạn. Cuộc sống có lúc bận —
                  điều đó không xoá đi công sức bạn đã bỏ ra.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ---------- Huy hiệu ---------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-sumi">Huy hiệu</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-sumi-muted">
            <input
              type="checkbox"
              checked={onlyUnlocked}
              onChange={(e) => setOnlyUnlocked(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8E2D9] text-sakura-500 focus:ring-sakura-400"
            />
            Chỉ hiện huy hiệu đã mở
          </label>
        </div>

        {grouped.length === 0 ? (
          <Card className="py-10 text-center text-sumi-muted">
            Chưa mở được huy hiệu nào. Học đều mỗi ngày là cách nhanh nhất để có chiếc đầu tiên.
          </Card>
        ) : (
          <div className="space-y-5">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sumi-muted">
                  {category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((a) => (
                    <AchievementCard key={a.code} achievement={a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const tier = TIER[a.tier] ?? TIER.bronze;

  // Huy hiệu có ngưỡng thì hiện luôn tiến độ, để người học biết còn bao xa
  const percent =
    a.threshold && a.threshold > 0 ? Math.min(100, (a.progress / a.threshold) * 100) : 0;

  return (
    <Card
      className={cn(
        'p-4 transition',
        a.unlocked ? `ring-1 ${tier.ring}` : 'opacity-70 grayscale',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            a.unlocked ? tier.bg : 'bg-black/5',
          )}
          aria-hidden="true"
        >
          {a.unlocked ? (
            <Award className={cn('h-6 w-6', tier.text)} />
          ) : (
            <Lock className="h-5 w-5 text-sumi-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h4 className="truncate font-semibold text-sumi">{a.nameVi}</h4>
            <span className={cn('shrink-0 text-xs font-medium', tier.text)}>{tier.label}</span>
          </div>
          <p className="mt-0.5 text-sm text-sumi-muted">{a.descriptionVi}</p>

          {!a.unlocked && a.threshold ? (
            <div className="mt-2.5">
              <ProgressBar
                percent={percent}
                label={`Tiến độ huy hiệu ${a.nameVi}`}
                tone="matcha"
              />
              <p className="mt-1 text-xs text-sumi-muted">
                {a.progress} / {a.threshold}
              </p>
            </div>
          ) : null}

          {a.unlocked && a.unlockedAt && (
            <p className="mt-1.5 text-xs text-matcha-700">
              Mở ngày {new Date(a.unlockedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
