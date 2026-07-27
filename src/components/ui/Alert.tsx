import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'bg-ai-50 text-ai-700 border-ai-200 dark:bg-ai-900/30 dark:text-ai-100',
    icon: <Info className="h-5 w-5 shrink-0" />,
  },
  success: {
    // Chữ dùng matcha-800 chứ không phải trắng: trắng trên nền Matcha chỉ đạt 2.6:1, không đạt WCAG AA
    wrapper: 'bg-matcha-50 text-matcha-800 border-matcha-200 dark:bg-matcha-900/30 dark:text-matcha-100',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0" />,
  },
  warning: {
    wrapper: 'bg-yamabuki-50 text-yamabuki-800 border-yamabuki-200 dark:bg-yamabuki-900/30 dark:text-yamabuki-100',
    icon: <TriangleAlert className="h-5 w-5 shrink-0" />,
  },
  error: {
    wrapper: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-100',
    icon: <AlertCircle className="h-5 w-5 shrink-0" />,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { wrapper, icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-2xl border p-4 text-sm', wrapper, className)}
    >
      {/* Icon đi kèm màu: không bao giờ dùng màu làm tín hiệu duy nhất */}
      <span aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}
