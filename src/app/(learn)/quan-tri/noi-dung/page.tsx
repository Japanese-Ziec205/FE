'use client';

import { useEffect, useMemo, useState } from 'react';
import { Archive, Search, Send, Upload } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi, useAction } from '@/hooks/useApi';
import type { ContentItem, ContentStatus, ContentType } from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

const TYPES: { id: ContentType; label: string; labelField: string }[] = [
  { id: 'vocabulary', label: 'Từ vựng', labelField: 'word' },
  { id: 'grammar', label: 'Ngữ pháp', labelField: 'pattern' },
  { id: 'sentence', label: 'Câu ví dụ', labelField: 'japanese' },
  { id: 'kanji', label: 'Kanji', labelField: 'character' },
  { id: 'kana', label: 'Bảng chữ', labelField: 'character' },
  { id: 'kotowaza', label: 'Tục ngữ', labelField: 'japanese' },
];

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'Nháp',
  pending_review: 'Chờ duyệt',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  archived: 'Đã lưu trữ',
};

const STATUS_STYLE: Record<ContentStatus, string> = {
  draft: 'bg-black/5 text-sumi-muted',
  pending_review: 'bg-yamabuki-50 text-yamabuki-800',
  approved: 'bg-ai-50 text-ai-500',
  published: 'bg-matcha-50 text-matcha-700',
  archived: 'bg-black/5 text-sumi-muted line-through',
};

/** Chỉ ba loại này có quy trình duyệt; Kanji/Kana/Tục ngữ là dữ liệu nền. */
const WITH_WORKFLOW = new Set<ContentType>(['vocabulary', 'grammar', 'sentence']);

export default function ContentManagerPage() {
  const [type, setType] = useState<ContentType>('vocabulary');
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Gõ tới đâu gọi API tới đó sẽ tạo hàng chục request thừa; chờ người dùng
  // ngừng gõ 400ms rồi mới tìm.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: '30' });
    if (status) params.set('status', status);
    if (debounced) params.set('search', debounced);
    return `/cms/${type}?${params.toString()}`;
  }, [type, status, debounced]);

  const { data, error, isLoading, reload } = useApi<ContentItem[]>(path);

  const act = useAction(async (id: string, action: 'submit' | 'publish' | 'archive') => {
    const result = await api.post<{ status: ContentStatus }>(`/cms/${type}/${id}/${action}`);
    reload();
    return result;
  });

  const run = async (id: string, action: 'submit' | 'publish' | 'archive') => {
    setNotice(null);
    const result = await act.run(id, action);
    if (result) {
      setNotice(
        {
          submit: 'Đã gửi duyệt. Giảng viên sẽ xem xét trong hàng chờ.',
          publish: 'Đã xuất bản. Người học thấy được ngay lập tức.',
          archive: 'Đã lưu trữ. Nội dung không còn hiện với người học.',
        }[action],
      );
    }
  };

  const labelField = TYPES.find((t) => t.id === type)?.labelField ?? 'word';

  return (
    <div className="space-y-4">
      {/* ---------- Chọn loại nội dung ---------- */}
      <div role="tablist" aria-label="Loại nội dung" className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={type === t.id}
            onClick={() => {
              setType(t.id);
              setStatus('');
            }}
            className={cn(
              'rounded-xl px-3 py-1.5 text-sm font-medium transition',
              type === t.id
                ? 'bg-sakura-500 text-white'
                : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-sakura-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- Lọc ---------- */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sumi-muted"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nội dung..."
            aria-label="Tìm nội dung"
            className="h-11 w-full rounded-xl border border-[#E8E2D9] bg-white pl-9 pr-3 text-sumi placeholder:text-sumi-muted focus:border-sakura-400 focus:outline-none focus:ring-2 focus:ring-sakura-100"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus | '')}
          aria-label="Lọc theo trạng thái"
          className="h-11 rounded-xl border border-[#E8E2D9] bg-white px-3 text-sumi focus:border-sakura-400 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(STATUS_LABEL) as ContentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {act.error && <Alert tone="error">{act.error}</Alert>}

      {isLoading ? (
        <Spinner label="Đang tải nội dung..." />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <Card className="py-10 text-center text-sumi-muted">
          Không có mục nào khớp bộ lọc.
        </Card>
      ) : (
        <ul className="space-y-2">
          {data.map((item) => {
            const label = String(item[labelField] ?? '(không có nhãn)');
            const itemStatus = item.status;
            return (
              <li key={item._id}>
                <Card className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-jp text-lg text-sumi">{label}</p>
                    <p className="truncate text-sm text-sumi-muted">
                      {describe(item, type)}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                      STATUS_STYLE[itemStatus] ?? 'bg-black/5 text-sumi-muted',
                    )}
                  >
                    {STATUS_LABEL[itemStatus] ?? itemStatus}
                  </span>

                  {WITH_WORKFLOW.has(type) && (
                    <div className="flex shrink-0 gap-1.5">
                      {itemStatus === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => run(item._id, 'submit')}
                          disabled={act.isRunning}
                        >
                          <Send className="h-3.5 w-3.5" aria-hidden="true" />
                          Gửi duyệt
                        </Button>
                      )}
                      {itemStatus === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => run(item._id, 'publish')}
                          disabled={act.isRunning}
                        >
                          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                          Xuất bản
                        </Button>
                      )}
                      {itemStatus === 'published' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => run(item._id, 'archive')}
                          disabled={act.isRunning}
                        >
                          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                          Lưu trữ
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-sm text-sumi-muted">
        Hiển thị tối đa 30 mục mỗi lần. Dùng ô tìm kiếm để thu hẹp kết quả.
      </p>
    </div>
  );
}

/** Dòng mô tả phụ, tuỳ theo loại nội dung có trường khác nhau. */
function describe(item: ContentItem, type: ContentType): string {
  const join = (v: unknown) => (Array.isArray(v) ? v.join(', ') : String(v ?? ''));
  switch (type) {
    case 'vocabulary':
      return `${item.reading ?? ''} — ${join(item.meaningsVi)}`;
    case 'grammar':
      return `${item.titleVi ?? ''} — ${item.meaningVi ?? ''}`;
    case 'sentence':
      return String(item.translationVi ?? '');
    case 'kanji':
      return `${item.sinoVietnamese ?? ''} — ${join(item.meaningsVi)}`;
    case 'kana':
      return String(item.romaji ?? '');
    case 'kotowaza':
      return String(item.meaningVi ?? '');
    default:
      return '';
  }
}
