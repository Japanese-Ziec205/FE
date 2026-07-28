import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Che bớt email khi hiển thị. */
export function maskIdentifier(value: string): string {
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
  }
  return `${value.slice(0, 4)}****${value.slice(-3)}`;
}

export function formatDateVi(input: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(input));
}

export function formatRelativeVi(input: string | Date): string {
  const diffMs = Date.now() - new Date(input).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDateVi(input);
}

/** Lời chào theo giờ trong ngày, kèm tiếng Nhật để người học quen dần. */
export function greetingByHour(hour = new Date().getHours()): { vi: string; jp: string } {
  if (hour < 11) return { vi: 'Chào buổi sáng', jp: 'おはようございます' };
  if (hour < 18) return { vi: 'Chào buổi chiều', jp: 'こんにちは' };
  return { vi: 'Chào buổi tối', jp: 'こんばんは' };
}
