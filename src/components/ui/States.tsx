import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/** Vòng quay chờ. Có nhãn cho trình đọc màn hình, không chỉ là hiệu ứng thị giác. */
export function Spinner({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-sakura-200 border-t-sakura-500" />
      <p className="text-sm text-sumi-muted">{label}</p>
    </div>
  );
}

/**
 * Báo lỗi tải dữ liệu.
 *
 * Luôn kèm nút thử lại: nguyên nhân hay gặp nhất là máy chủ Render gói miễn phí
 * vừa thức dậy sau 15 phút ngủ, và lần gọi thứ hai gần như luôn thành công.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-beni" aria-hidden="true" />
      <p className="max-w-md text-sumi-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

/** Trạng thái rỗng — luôn nói rõ bước tiếp theo, không chỉ báo "không có gì". */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-sakura-400" aria-hidden="true">
        {icon ?? <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="text-lg font-semibold text-sumi">{title}</h3>
      <p className="max-w-md text-sumi-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Ô số liệu dùng chung cho trang chính và trang thành tích. */
export function StatTile({
  label,
  value,
  unit,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-center gap-2 text-sumi-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-1.5 text-2xl font-bold text-sumi">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-sumi-muted">{unit}</span>}
      </p>
    </div>
  );
}

/** Thanh tiến độ có nhãn cho trình đọc màn hình. */
export function ProgressBar({
  percent,
  label,
  tone = 'sakura',
}: {
  percent: number;
  label: string;
  tone?: 'sakura' | 'matcha' | 'ai';
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const fill = {
    sakura: 'bg-sakura-500',
    matcha: 'bg-matcha-500',
    ai: 'bg-ai-500',
  }[tone];

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-black/8"
    >
      <div className={cn('h-full rounded-full transition-all duration-500', fill)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
