'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, LockKeyhole, User } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { useAuthStore } from '@/lib/auth-store';
import { ApiException } from '@/lib/api-client';
import { passwordStrength, registerSchema, type RegisterForm } from '@/lib/validators';
import { cn } from '@/lib/utils';

const STRENGTH_COLORS = ['bg-beni', 'bg-beni', 'bg-yamabuki-400', 'bg-matcha-400', 'bg-matcha-500'];

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      identifier: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  const password = watch('password') ?? '';
  const strength = passwordStrength(password);

  const onSubmit = async (values: RegisterForm) => {
    setFormError(null);
    try {
      const result = await registerUser({
        identifier: values.identifier,
        password: values.password,
        displayName: values.displayName,
      });

      if (result.otpSent) {
        // Chuyển sang màn nhập OTP, mang theo định danh để không phải gõ lại
        router.push(
          `/xac-thuc?dinh-danh=${encodeURIComponent(values.identifier)}&muc-dich=verify_email`,
        );
      } else {
        // Đăng ký bằng SĐT: SMS chưa bật ở giai đoạn 1, cho vào đăng nhập luôn
        router.push(
          `/dang-nhap?dang-ky=thanh-cong&dinh-danh=${encodeURIComponent(values.identifier)}`,
        );
      }
    } catch (err) {
      if (err instanceof ApiException) {
        const issues = err.fieldIssues;
        if (issues.length > 0) {
          issues.forEach((i) => setError(i.field as keyof RegisterForm, { message: i.message }));
          return;
        }
        setFormError(err.message);
        return;
      }
      setFormError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Mascot pose="cheer" className="mx-auto h-20 w-20" />
        <h1 className="mt-3 text-2xl font-bold text-sumi">Bắt đầu hành trình</h1>
        <p className="mt-1 text-sumi-muted">Miễn phí mãi mãi, không cần thẻ ngân hàng</p>
      </div>

      {formError && (
        <Alert tone="error" className="mb-5">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Tên hiển thị"
          placeholder="Bạn muốn được gọi là gì?"
          autoComplete="name"
          leftIcon={<User className="h-5 w-5" />}
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <Input
          label="Email hoặc số điện thoại"
          placeholder="vidu@gmail.com hoặc 0912345678"
          autoComplete="username"
          leftIcon={<AtSign className="h-5 w-5" />}
          hint="Dùng để đăng nhập và khôi phục tài khoản"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <div>
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Ít nhất 8 ký tự"
            autoComplete="new-password"
            leftIcon={<LockKeyhole className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {password && !errors.password && (
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
          label="Nhập lại mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu ở trên"
          autoComplete="new-password"
          leftIcon={<LockKeyhole className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-[#E8E2D9] accent-sakura-500"
              {...register('acceptTerms')}
            />
            <span className="text-sm text-sumi-muted">
              Tôi đồng ý với{' '}
              <Link href="/dieu-khoan" className="font-medium text-sakura-600 hover:underline">
                điều khoản sử dụng
              </Link>{' '}
              và{' '}
              <Link href="/rieng-tu" className="font-medium text-sakura-600 hover:underline">
                chính sách riêng tư
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p role="alert" className="mt-1.5 text-sm text-beni">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-sumi-muted">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="font-semibold text-sakura-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </Card>
  );
}
