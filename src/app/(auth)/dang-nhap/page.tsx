'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { useAuthStore } from '@/lib/auth-store';
import { ApiException } from '@/lib/api-client';
import { loginSchema, type LoginForm } from '@/lib/validators';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [formError, setFormError] = useState<string | null>(null);
  const justRegistered = params.get('dang-ky') === 'thanh-cong';
  const justReset = params.get('dat-lai') === 'thanh-cong';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: params.get('dinh-danh') ?? '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setFormError(null);
    try {
      const result = await login(values.identifier, values.password);
      // Tài khoản cũ tạo trước khi có bước chọn cấp độ cũng phải đi qua đây
      router.push(result.onboardingCompleted ? '/bang-dieu-khien' : '/chon-cap-do');
    } catch (err) {
      if (err instanceof ApiException) {
        /**
         * Mật khẩu đúng nhưng email chưa xác thực. Server đã tự gửi lại mã, nên
         * đưa thẳng người dùng sang màn nhập mã thay vì bắt họ đọc lỗi rồi tự
         * mò đường — đây là ngõ cụt hay gặp nhất của luồng đăng ký.
         */
        if (err.code === 'AUTH_EMAIL_NOT_VERIFIED') {
          router.push(
            `/xac-thuc?dinh-danh=${encodeURIComponent(values.identifier)}&muc-dich=verify_email&chua-xac-thuc=1`,
          );
          return;
        }

        // Lỗi validate từ server thì gắn đúng vào từng ô nhập
        const issues = err.fieldIssues;
        if (issues.length > 0) {
          issues.forEach((i) => setError(i.field as keyof LoginForm, { message: i.message }));
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
        <Mascot pose="wave" className="mx-auto h-20 w-20" />
        <h1 className="mt-3 text-2xl font-bold text-sumi">Chào mừng trở lại!</h1>
        <p className="mt-1 text-sumi-muted">おかえりなさい</p>
      </div>

      {justRegistered && (
        <Alert tone="success" className="mb-5">
          Tạo tài khoản thành công. Đăng nhập để bắt đầu học nhé!
        </Alert>
      )}
      {justReset && (
        <Alert tone="success" className="mb-5">
          Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.
        </Alert>
      )}
      {formError && (
        <Alert tone="error" className="mb-5">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="vidu@gmail.com"
          autoComplete="email"
          leftIcon={<AtSign className="h-5 w-5" />}
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          leftIcon={<LockKeyhole className="h-5 w-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link href="/quen-mat-khau" className="text-sm font-medium text-sakura-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-sumi-muted">
        Chưa có tài khoản?{' '}
        <Link href="/dang-ky" className="font-semibold text-sakura-600 hover:underline">
          Đăng ký miễn phí
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  // useSearchParams cần Suspense boundary trong App Router
  return (
    <Suspense fallback={<Card className="p-8 text-center text-sumi-muted">Đang tải...</Card>}>
      <LoginForm />
    </Suspense>
  );
}
