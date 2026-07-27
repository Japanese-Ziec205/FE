'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, KeyRound, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { api, ApiException } from '@/lib/api-client';
import { passwordStrength, resetPasswordSchema, type ResetPasswordForm } from '@/lib/validators';
import { cn } from '@/lib/utils';

const STRENGTH_COLORS = ['bg-beni', 'bg-beni', 'bg-yamabuki-400', 'bg-matcha-400', 'bg-matcha-500'];

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get('dinh-danh') ?? '';

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: params.get('ma') ?? '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') ?? '';
  const strength = passwordStrength(newPassword);

  const onSubmit = async (values: ResetPasswordForm) => {
    setFormError(null);
    try {
      await api.post('/auth/reset-password', {
        identifier,
        code: values.code,
        newPassword: values.newPassword,
      });
      router.push(
        `/dang-nhap?dat-lai=thanh-cong&dinh-danh=${encodeURIComponent(identifier)}`,
      );
    } catch (err) {
      if (err instanceof ApiException) {
        const issues = err.fieldIssues;
        if (issues.length > 0) {
          issues.forEach((i) => setError(i.field as keyof ResetPasswordForm, { message: i.message }));
          return;
        }
        setFormError(err.message);
        return;
      }
      setFormError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  if (!identifier) {
    return (
      <Card className="p-6 sm:p-8">
        <Alert tone="error" title="Thiếu thông tin">
          Không xác định được tài khoản. Vui lòng bắt đầu lại từ bước quên mật khẩu.
        </Alert>
        <Button className="mt-5" fullWidth onClick={() => router.push('/quen-mat-khau')}>
          Về trang quên mật khẩu
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Mascot pose="write" className="mx-auto h-20 w-20" />
        <h1 className="mt-3 text-2xl font-bold text-sumi">Đặt lại mật khẩu</h1>
        <p className="mt-2 text-sumi-muted">
          Nhập mã đã gửi tới
          <br />
          <span className="font-medium text-sumi">{identifier}</span>
        </p>
      </div>

      {formError && (
        <Alert tone="error" className="mb-5">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Mã xác thực"
          placeholder="6 chữ số"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          leftIcon={<KeyRound className="h-5 w-5" />}
          error={errors.code?.message}
          {...register('code')}
        />

        <div>
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="Ít nhất 8 ký tự"
            autoComplete="new-password"
            leftIcon={<LockKeyhole className="h-5 w-5" />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          {newPassword && !errors.newPassword && (
            <div className="mt-2">
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i < strength.score ? STRENGTH_COLORS[strength.score] : 'bg-[#E8E2D9]',
                    )}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm text-sumi-muted">Độ mạnh: {strength.label}</p>
            </div>
          )}
        </div>

        <Input
          label="Nhập lại mật khẩu mới"
          type="password"
          autoComplete="new-password"
          leftIcon={<LockKeyhole className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Alert tone="info">
          Sau khi đổi mật khẩu, mọi thiết bị đang đăng nhập sẽ bị đăng xuất để đảm bảo an toàn.
        </Alert>

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
        </Button>
      </form>

      <Link
        href="/dang-nhap"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-sumi-muted hover:text-sumi"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Quay lại đăng nhập
      </Link>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="p-8 text-center text-sumi-muted">Đang tải...</Card>}>
      <ResetForm />
    </Suspense>
  );
}
