'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/auth-store';
import type { PoolHealth } from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { ErrorState, ProgressBar, Spinner, StatTile } from '@/components/ui/States';
import { cn } from '@/lib/utils';

const VARIANTS = [
  { id: 'reading_writing', label: 'Đề Đọc & Viết' },
  { id: 'standard', label: 'Đề đầy đủ (có Nghe)' },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  lecturer: 'Giảng viên',
  contributor: 'Cộng tác viên',
  student: 'Học viên',
};

export default function AdminOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [variant, setVariant] = useState('reading_writing');

  const pool = useApi<PoolHealth>(`/exams/pool-health?level=N5&variant=${variant}`);
  const publicStats = useApi<{
    learners: number;
    kanaCount: number;
    kanjiCount: number;
    communityStudyHours: number;
  }>('/public/stats');

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-3">
        <Users className="h-6 w-6 shrink-0 text-ai-500" aria-hidden="true" />
        <p className="flex-1 text-sumi">
          Bạn đang đăng nhập với vai trò{' '}
          <strong>{ROLE_LABEL[user?.role ?? 'student'] ?? user?.role}</strong>.
          {user?.role === 'contributor' &&
            ' Bạn tạo và sửa được bản nháp, nhưng việc xuất bản do giảng viên duyệt.'}
          {user?.role === 'lecturer' && ' Bạn duyệt và xuất bản được nội dung của người khác.'}
        </p>
      </Card>

      {publicStats.data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Người học" value={publicStats.data.learners} />
          <StatTile label="Chữ cái" value={publicStats.data.kanaCount} />
          <StatTile label="Kanji" value={publicStats.data.kanjiCount} />
          <StatTile
            label="Giờ học cộng đồng"
            value={publicStats.data.communityStudyHours}
            unit="giờ"
          />
        </div>
      )}

      {/* ---------- Sức khoẻ ngân hàng câu hỏi ---------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-sumi">Ngân hàng câu hỏi N5</h2>
          <div className="flex gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                aria-pressed={variant === v.id}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-sm font-medium transition',
                  variant === v.id
                    ? 'bg-ai-500 text-white'
                    : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9]',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {pool.isLoading ? (
          <Spinner label="Đang kiểm tra kho câu hỏi..." />
        ) : pool.error ? (
          <ErrorState message={pool.error} onRetry={pool.reload} />
        ) : pool.data ? (
          <>
            <Alert
              tone={
                pool.data.overallStatus === 'insufficient'
                  ? 'error'
                  : pool.data.overallStatus === 'warning'
                    ? 'warning'
                    : 'success'
              }
              className="mb-3"
            >
              {pool.data.canGenerate
                ? pool.data.overallStatus === 'warning'
                  ? 'Sinh đề được, nhưng vài phần còn ít câu nên các đề sẽ hay trùng nhau.'
                  : 'Kho câu hỏi đầy đủ, đề sinh ra sẽ đa dạng.'
                : 'KHÔNG sinh được đề: có phần chưa đủ số câu tối thiểu.'}
            </Alert>

            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-[#E8E2D9] text-left text-sumi-muted">
                    <th className="p-3 font-medium">Phần (mondai)</th>
                    <th className="p-3 font-medium">Cần</th>
                    <th className="p-3 font-medium">Đang có</th>
                    <th className="p-3 font-medium">Độ đa dạng</th>
                  </tr>
                </thead>
                <tbody>
                  {pool.data.mondai.map((m) => (
                    <tr key={m.code} className="border-b border-[#E8E2D9] last:border-0">
                      <td className="p-3">
                        <p className="font-medium text-sumi">{m.nameVi}</p>
                        <p className="text-xs text-sumi-muted">{m.code}</p>
                      </td>
                      <td className="p-3 text-sumi-muted">{m.required}</td>
                      <td
                        className={cn(
                          'p-3 font-semibold',
                          m.status === 'insufficient'
                            ? 'text-beni'
                            : m.status === 'warning'
                              ? 'text-yamabuki-700'
                              : 'text-matcha-700',
                        )}
                      >
                        {m.available}
                      </td>
                      <td className="p-3">
                        <ProgressBar
                          percent={(m.available / Math.max(1, m.recommendedMin)) * 100}
                          label={`Độ đa dạng ${m.nameVi}`}
                          tone={
                            m.status === 'insufficient'
                              ? 'sakura'
                              : m.status === 'warning'
                                ? 'ai'
                                : 'matcha'
                          }
                        />
                        {m.message && (
                          <p className="mt-1 text-xs text-sumi-muted">{m.message}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <p className="mt-2 flex items-start gap-1.5 text-sm text-sumi-muted">
              {pool.data.overallStatus === 'healthy' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-matcha-600" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yamabuki-600" aria-hidden="true" />
              )}
              Nên có gấp ba lần số câu cần dùng. Kho càng rộng thì hai lần thi liên tiếp càng ít
              gặp lại câu cũ, và điểm số càng phản ánh đúng năng lực.
            </p>
          </>
        ) : null}
      </section>

      <Card>
        <h2 className="font-semibold text-sumi">Việc thường làm</h2>
        <ul className="mt-3 space-y-2 text-sumi-muted">
          <li>
            <Link href="/quan-tri/noi-dung" className="font-medium text-sakura-600 hover:underline">
              Kho nội dung
            </Link>{' '}
            — thêm, sửa, xuất bản từ vựng, ngữ pháp, câu ví dụ.
          </li>
          <li>
            <Link href="/quan-tri/duyet" className="font-medium text-sakura-600 hover:underline">
              Hàng chờ duyệt
            </Link>{' '}
            — xem nội dung cộng tác viên gửi lên và quyết định xuất bản.
          </li>
        </ul>
      </Card>
    </div>
  );
}
