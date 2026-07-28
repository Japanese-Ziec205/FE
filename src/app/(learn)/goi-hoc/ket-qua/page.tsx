'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

import { api, ApiException } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/States';
import { Mascot } from '@/components/ui/Mascot';
import type { PaymentStatus } from '@/lib/learn-types';

/**
 * Trang PayOS trả người dùng về sau khi thanh toán.
 *
 * ĐIỀU QUAN TRỌNG NHẤT: trang này chỉ HIỂN THỊ trạng thái, nó không hề cấp
 * quyền cho ai. Việc cộng hạn dùng chỉ xảy ra ở webhook đã xác minh chữ ký —
 * bất kỳ ai cũng gõ được địa chỉ này vào trình duyệt.
 *
 * Cần hỏi lại nhiều lần vì webhook của PayOS có thể tới sau khi người dùng đã
 * bị chuyển hướng về. Vài giây đầu thấy "đang chờ" là chuyện bình thường.
 */
const POLL_INTERVAL_MS = 2_500;
const MAX_POLLS = 12; // khoảng 30 giây

function ResultContent() {
  const params = useSearchParams();
  const orderCode = params.get('ma-don');

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const check = useCallback(async () => {
    if (!orderCode) return;
    try {
      const data = await api.get<PaymentStatus>(`/billing/payments/${orderCode}`);
      setStatus(data);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'Không tra cứu được đơn hàng.');
    }
  }, [orderCode]);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    // Dừng hỏi lại khi đơn đã có kết luận, hoặc đã hỏi đủ số lần
    if (!status || status.status !== 'pending' || attempts >= MAX_POLLS) return;

    const timer = setTimeout(() => {
      setAttempts((a) => a + 1);
      void check();
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [status, attempts, check]);

  if (!orderCode) {
    return (
      <Card className="text-center">
        <p className="text-sumi-muted">Thiếu mã đơn hàng.</p>
        <Button className="mt-4" onClick={() => (window.location.href = '/goi-hoc')}>
          Về trang gói học
        </Button>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <XCircle className="mx-auto h-12 w-12 text-beni" aria-hidden="true" />
        <p className="mt-3 text-sumi">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => void check()}>
          Thử lại
        </Button>
      </Card>
    );
  }

  if (!status) return <Spinner label="Đang kiểm tra đơn hàng..." />;

  if (status.status === 'paid') {
    return (
      <Card className="text-center">
        <Mascot pose="wave" className="mx-auto h-24 w-24" />
        <CheckCircle2 className="mx-auto mt-2 h-10 w-10 text-matcha-600" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold text-sumi">Cảm ơn bạn rất nhiều! 🌸</h1>
        <p className="mt-2 text-sumi-muted">
          {status.planNameVi} đã được kích hoạt. Thi thử đã mở khoá và ôn tập không còn giới hạn.
        </p>
        <p className="mt-1 text-sm text-sumi-muted">
          Đơn #{status.orderCode} · {status.amount.toLocaleString('vi-VN')}₫
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/thi-thu">
            <Button>Vào thi thử ngay</Button>
          </Link>
          <Link href="/bang-dieu-khien">
            <Button variant="outline">Về trang chính</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (status.status === 'pending') {
    const gaveUp = attempts >= MAX_POLLS;
    return (
      <Card className="text-center">
        <Clock className="mx-auto h-10 w-10 text-yamabuki-600" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-sumi">
          {gaveUp ? 'Chưa nhận được xác nhận' : 'Đang chờ xác nhận từ ngân hàng...'}
        </h1>
        <p className="mt-2 text-sumi-muted">
          {gaveUp
            ? 'Nếu bạn đã chuyển khoản, tiền vẫn được ghi nhận — đôi khi ngân hàng cần vài phút. Hãy tải lại trang sau ít phút.'
            : 'Thường mất vài giây. Bạn đừng đóng trang này nhé.'}
        </p>
        <p className="mt-1 text-sm text-sumi-muted">Đơn #{status.orderCode}</p>
        {gaveUp && (
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => {
              setAttempts(0);
              void check();
            }}
          >
            Kiểm tra lại
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <XCircle className="mx-auto h-10 w-10 text-beni" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-bold text-sumi">Giao dịch chưa hoàn tất</h1>
      <p className="mt-2 text-sumi-muted">
        Đơn #{status.orderCode} không được thanh toán. Không có khoản tiền nào bị trừ.
      </p>
      <Link href="/goi-hoc">
        <Button className="mt-5">Thử lại</Button>
      </Link>
    </Card>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="mx-auto max-w-lg py-6">
      <Suspense fallback={<Spinner label="Đang tải..." />}>
        <ResultContent />
      </Suspense>
    </div>
  );
}
