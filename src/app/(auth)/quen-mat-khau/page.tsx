'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';
import { api, ApiException } from '@/lib/api-client';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/lib/validators';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (values: ForgotPasswordForm) => {
    setFormError(null);
    try {
      await api.post('/auth/forgot-password', { identifier: values.identifier });
      // Server luôn trả về thành công dù tài khoản có tồn tại hay không,
      // nên ở đây cứ chuyển sang bước nhập mã.
      router.push(
        `/dat-lai-mat-khau?dinh-danh=${encodeURIComponent(values.identifier)}`,
      );
    } catch (err) {
      setFormError(
        err instanceof ApiException ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      );
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 text-center">
        <Mascot pose="write" className="mx-auto h-20 w-20" />
        <h1 className="mt-3 text-2xl font-bold text-sumi">Quên mật khẩu?</h1>
        <p className="mt-2 text-sumi-muted">
          Không sao cả. Nhập email của bạn, chúng mình sẽ gửi mã để đặt lại mật khẩu.
        </p>
      </div>

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

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực'}
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
