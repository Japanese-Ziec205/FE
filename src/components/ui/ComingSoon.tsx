import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Mascot } from '@/components/ui/Mascot';

/**
 * Màn hình tạm cho các module đang xây dựng.
 * Nói rõ đang làm gì và khi nào có, thay vì để trang trống hoặc lỗi 404.
 */
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <Card className="mx-auto max-w-lg py-10 text-center">
      <Mascot pose="write" className="mx-auto h-24 w-24" />
      <h1 className="mt-4 text-2xl font-bold text-sumi">{title}</h1>
      <p className="mt-3 text-sumi-muted">{description}</p>
      <p className="mt-4 inline-block rounded-full bg-yamabuki-50 px-3 py-1 text-sm font-medium text-yamabuki-800">
        Đang phát triển · {phase}
      </p>
      <div className="mt-6">
        <Link
          href="/bang-dieu-khien"
          className="inline-flex h-12 items-center rounded-2xl border-2 border-sakura-500 px-6 font-semibold text-sakura-600 transition hover:bg-sakura-50"
        >
          Về trang chính
        </Link>
      </div>
    </Card>
  );
}
