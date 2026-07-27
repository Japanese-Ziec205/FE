'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  // Chữ 16px + font-semibold vì trắng trên Sakura chỉ đạt tương phản 3.4:1,
  // WCAG AA chấp nhận mức đó với chữ lớn/đậm (xem tài liệu thiết kế 10, mục 2.3)
  primary: 'bg-sakura-500 text-white font-semibold hover:bg-sakura-600 active:bg-sakura-700 shadow-sm',
  secondary: 'bg-ai-500 text-white font-semibold hover:bg-ai-600 active:bg-ai-700 shadow-sm',
  outline:
    'border-2 border-sakura-500 text-sakura-600 font-semibold hover:bg-sakura-50 active:bg-sakura-100',
  ghost: 'text-sumi-muted hover:bg-black/5 dark:hover:bg-white/5',
  danger: 'bg-beni text-white font-semibold hover:brightness-95',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm rounded-xl',
  md: 'h-12 px-5 text-base rounded-2xl',
  lg: 'h-14 px-7 text-lg rounded-2xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', isLoading, fullWidth, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
