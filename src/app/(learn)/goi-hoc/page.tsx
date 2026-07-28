'use client';

import { Check, ExternalLink, Heart, Sparkles } from 'lucide-react';

import { useApi, useAction } from '@/hooks/useApi';
import { useEntitlements } from '@/hooks/useEntitlements';
import { api } from '@/lib/api-client';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ErrorState, Spinner } from '@/components/ui/States';
import type { CheckoutResult, Plan, PlanList } from '@/lib/learn-types';
import { cn } from '@/lib/utils';

const dong = (amount: number) => `${amount.toLocaleString('vi-VN')}₫`;

export default function PlansPage() {
  const plans = useApi<PlanList>('/billing/plans');
  const { entitlements, isPremium, isLoading: loadingEnt } = useEntitlements();

  const checkout = useAction(async (planCode: string) => {
    const result = await api.post<CheckoutResult>('/billing/checkout', { planCode });
    // Chuyển thẳng sang trang thanh toán của PayOS
    window.location.href = result.checkoutUrl;
  });

  if (plans.isLoading || loadingEnt) return <Spinner label="Đang tải thông tin gói..." />;
  if (plans.error) return <ErrorState message={plans.error} onRetry={plans.reload} />;

  const data = plans.data!;
  const free = data.freeTier;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-sumi">Gói học</h1>
        <p className="mx-auto mt-3 max-w-xl text-sumi-muted">
          Kizuna là dự án phi lợi nhuận. Toàn bộ tiền thu được dùng để trả chi phí máy chủ và
          biên soạn nội dung — không có cổ đông nào chia lợi nhuận ở đây cả.
        </p>
      </header>

      {isPremium && entitlements && (
        <Alert tone="success">
          Bạn đang dùng <strong>{entitlements.planCode === 'monthly' ? 'gói 1 tháng' : 'gói 6 tháng'}</strong>,
          còn <strong>{entitlements.daysRemaining} ngày</strong>. Mua thêm bây giờ sẽ được cộng
          dồn vào hạn hiện tại chứ không mất số ngày còn lại.
        </Alert>
      )}

      {checkout.error && <Alert tone="error">{checkout.error}</Alert>}

      {!data.paymentAvailable && (
        <Alert tone="info">
          Cổng thanh toán chưa được bật trên máy chủ này, nên tạm thời chưa mua gói được. Mọi
          tính năng miễn phí vẫn hoạt động bình thường.
        </Alert>
      )}

      {/* ---------- Hai gói ---------- */}
      <div className="grid gap-4 sm:grid-cols-2">
        {data.plans.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            highlighted={plan.code === 'half_year'}
            disabled={!data.paymentAvailable}
            isRunning={checkout.isRunning}
            onBuy={() => checkout.run(plan.code)}
          />
        ))}
      </div>

      {/* ---------- So sánh ---------- */}
      <Card>
        <CardHeader title="Miễn phí và trả phí khác nhau ở đâu?" />
        <ul className="space-y-3 text-sm">
          <Compare
            label="Học bài, tra từ vựng, Hán tự, ngữ pháp"
            free="Không giới hạn"
            paid="Không giới hạn"
          />
          <Compare
            label="Ôn tập thẻ ghi nhớ"
            free={`${free.dailyReviewLimit} thẻ mỗi ngày`}
            paid="Không giới hạn"
          />
          <Compare
            label="Hoàn thành bài học mới"
            free={`${free.dailyLessonLimit} bài mỗi ngày`}
            paid="Không giới hạn"
          />
          <Compare label="Thi thử JLPT" free="Chưa mở" paid="Toàn bộ 5 cấp × 3 mức độ" />
          <Compare label="Bảng xếp hạng, huy hiệu, chuỗi ngày" free="Có" paid="Có" />
        </ul>

        <p className="mt-4 rounded-2xl bg-matcha-50 p-4 text-sm text-sumi">
          <Heart className="mr-1.5 inline h-4 w-4 text-sakura-500" aria-hidden="true" />
          Nếu bạn thật sự khó khăn về tài chính mà cần thi thử, hãy nhắn cho ban quản trị. Dự án
          sinh ra để phục vụ người học khó khăn — chúng mình sẽ tìm cách.
        </p>
      </Card>

      <p className="text-center text-sm text-sumi-muted">
        Thanh toán qua PayOS bằng chuyển khoản ngân hàng hoặc quét mã QR. Kizuna không lưu bất
        kỳ thông tin thẻ hay tài khoản ngân hàng nào của bạn.
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  highlighted,
  disabled,
  isRunning,
  onBuy,
}: {
  plan: Plan;
  highlighted: boolean;
  disabled: boolean;
  isRunning: boolean;
  onBuy: () => void;
}) {
  // Giá quy về mỗi tháng, để người dùng so sánh được hai gói mà không phải tự tính
  const perMonth = Math.round(plan.amount / (plan.durationDays / 30));

  return (
    <Card className={cn('flex flex-col', highlighted && 'ring-2 ring-sakura-400')}>
      {highlighted && (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-sakura-500 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Tiết kiệm nhất
        </span>
      )}

      <h2 className="text-lg font-bold text-sumi">{plan.nameVi}</h2>

      <p className="mt-2">
        <span className="text-3xl font-bold text-sumi">{dong(plan.amount)}</span>
        <span className="ml-1 text-sumi-muted">/ {plan.durationDays} ngày</span>
      </p>
      {plan.durationDays > 30 && (
        <p className="mt-0.5 text-sm text-matcha-700">Tính ra {dong(perMonth)} mỗi tháng</p>
      )}

      <p className="mt-3 flex-1 text-sm text-sumi-muted">{plan.descriptionVi}</p>

      <Button className="mt-4" fullWidth disabled={disabled} isLoading={isRunning} onClick={onBuy}>
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Mua gói này
      </Button>
    </Card>
  );
}

function Compare({ label, free, paid }: { label: string; free: string; paid: string }) {
  return (
    <li className="grid grid-cols-1 gap-1 border-b border-[#E8E2D9] pb-3 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4">
      <span className="font-medium text-sumi">{label}</span>
      <span className="text-sumi-muted sm:w-40 sm:text-right">{free}</span>
      <span className="inline-flex items-center gap-1 font-medium text-matcha-700 sm:w-48 sm:justify-end">
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        {paid}
      </span>
    </li>
  );
}
