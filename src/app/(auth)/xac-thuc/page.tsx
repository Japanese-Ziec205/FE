'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiException } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const identifier = params.get('dinh-danh') ?? '';
  const purpose = params.get('muc-dich') ?? 'verify_email';
  // Người dùng bị đá về đây từ màn đăng nhập vì email chưa xác thực. Cần nói rõ
  // lý do, nếu không họ sẽ tưởng đăng nhập bị lỗi.
  const cameFromLogin = params.get('chua-xac-thuc') === '1';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const submit = async (code: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await verifyOtp(identifier, code, purpose);
      if (result.nextStep === 'reset_password') {
        router.push(
          `/dat-lai-mat-khau?dinh-danh=${encodeURIComponent(identifier)}&ma=${encodeURIComponent(code)}`,
        );
      } else {
        router.push('/bang-dieu-khien');
      }
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const updateDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }

    // Dán cả mã 6 số vào một ô thì trải đều ra các ô còn lại
    if (clean.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      clean
        .slice(0, OTP_LENGTH)
        .split('')
        .forEach((c, i) => {
          next[i] = c;
        });
      setDigits(next);
      const filled = Math.min(clean.length, OTP_LENGTH);
      inputsRef.current[filled - 1]?.focus();
      if (filled === OTP_LENGTH) void submit(next.join(''));
      return;
    }

    const next = digits.map((d, i) => (i === index ? clean : d));
    setDigits(next);
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
    // Đủ 6 số thì gửi luôn, không bắt bấm nút
    if (next.every((d) => d !== '')) void submit(next.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await api.post('/auth/otp/send', { identifier, purpose });
      setInfo('Đã gửi lại mã xác thực. Kiểm tra hộp thư của bạn nhé.');
      setCooldown(60);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Không gửi lại được mã.');
    }
  };

  if (!identifier) {
    return (
      <Card className="p-6 sm:p-8">
        <Alert tone="error" title="Thiếu thông tin">
          Không xác định được tài khoản cần xác thực. Vui lòng đăng ký hoặc đăng nhập lại.
        </Alert>
        <Button className="mt-5" fullWidth onClick={() => router.push('/dang-ky')}>
          Về trang đăng ký
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Mascot pose="write" className="mx-auto h-20 w-20" />
        <h1 className="mt-3 text-2xl font-bold text-sumi">Nhập mã xác thực</h1>
        <p className="mt-2 text-sumi-muted">
          Mã gồm 6 chữ số đã được gửi tới
          <br />
          <span className="font-medium text-sumi">{identifier}</span>
        </p>
      </div>

      {cameFromLogin && !error && (
        <Alert tone="info" className="mb-5">
          Tài khoản của bạn chưa xác thực email nên chưa đăng nhập được. Chúng mình vừa gửi
          lại mã mới — nhập mã bên dưới là vào học được ngay.
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      )}
      {info && (
        <Alert tone="success" className="mb-5">
          {info}
        </Alert>
      )}

      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={OTP_LENGTH}
            value={digit}
            disabled={submitting}
            aria-label={`Chữ số thứ ${i + 1}`}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'h-14 w-12 rounded-2xl border-2 text-center text-2xl font-bold transition-colors',
              'focus:border-sakura-400 focus:outline-none disabled:opacity-50',
              digit ? 'border-sakura-400 bg-sakura-50' : 'border-[#E8E2D9] bg-white',
            )}
          />
        ))}
      </div>

      <Button
        className="mt-6"
        size="lg"
        fullWidth
        isLoading={submitting}
        disabled={digits.some((d) => !d)}
        onClick={() => submit(digits.join(''))}
      >
        {submitting ? 'Đang xác thực...' : 'Xác thực'}
      </Button>

      <div className="mt-5 text-center text-sm">
        {cooldown > 0 ? (
          <span className="text-sumi-muted">Gửi lại mã sau {cooldown} giây</span>
        ) : (
          <button onClick={resend} className="font-semibold text-sakura-600 hover:underline">
            Gửi lại mã xác thực
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-sumi-muted">
        Không thấy email? Hãy kiểm tra cả thư mục Spam.
      </p>
    </Card>
  );
}

export default function VerifyPage() {
  // useSearchParams cần Suspense trong App Router khi build tĩnh
  return (
    <Suspense fallback={<Card className="p-8 text-center text-sumi-muted">Đang tải...</Card>}>
      <VerifyForm />
    </Suspense>
  );
}
