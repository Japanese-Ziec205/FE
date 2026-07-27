'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, leftIcon, type = 'text', id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && revealed ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-sumi dark:text-white">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sumi-muted">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={actualType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'h-12 w-full rounded-2xl border-2 bg-white px-4 text-base transition-colors',
            'placeholder:text-sumi-muted/60 dark:bg-[#1D222E] dark:text-white',
            'focus:outline-none focus:ring-0',
            leftIcon && 'pl-11',
            isPassword && 'pr-12',
            error
              ? 'border-beni focus:border-beni'
              : 'border-[#E8E2D9] focus:border-sakura-400 dark:border-[#2C3342]',
            className,
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-sumi-muted hover:bg-black/5"
          >
            {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* aria-live để trình đọc màn hình thông báo lỗi ngay khi xuất hiện */}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-beni">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-sumi-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
