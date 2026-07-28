'use client';

import { useState } from 'react';
import { AlertCircle, Check, MessageSquare, X } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi, useAction } from '@/hooks/useApi';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

type Decision = 'approve' | 'request_changes' | 'reject';

interface QueueTask {
  _id: string;
  targetType: string;
  targetId: string;
  status: string;
  isOverdue: boolean;
  submittedAt?: string;
  submittedBy?: { profile?: { displayName?: string }; role?: string } | null;
  content: Record<string, unknown> | null;
}

const TYPE_LABEL: Record<string, string> = {
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
  sentence: 'Câu ví dụ',
  kotowaza: 'Tục ngữ',
};

export default function ReviewQueuePage() {
  const { data, error, isLoading, reload } = useApi<QueueTask[]>('/cms/review/queue');
  const [notice, setNotice] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const decide = useAction(async (taskId: string, decision: Decision, noteText: string) => {
    const result = await api.post(`/cms/review/${taskId}`, { decision, note: noteText });
    reload();
    return result;
  });

  const submit = async (taskId: string, decision: Decision) => {
    // Từ chối hay yêu cầu sửa mà không nói lý do thì người soạn không biết sửa gì
    if (decision !== 'approve' && note.trim().length < 5) {
      setNotice(null);
      setOpenNote(taskId);
      return;
    }
    const result = await decide.run(taskId, decision, note.trim());
    if (result) {
      setNotice(
        {
          approve: 'Đã duyệt. Nội dung sẵn sàng để xuất bản.',
          request_changes: 'Đã gửi yêu cầu chỉnh sửa kèm ghi chú.',
          reject: 'Đã từ chối nội dung này.',
        }[decision],
      );
      setOpenNote(null);
      setNote('');
    }
  };

  if (isLoading) return <Spinner label="Đang tải hàng chờ..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      {notice && <Alert tone="success">{notice}</Alert>}
      {decide.error && <Alert tone="error">{decide.error}</Alert>}

      <Alert tone="info">
        Bạn <strong>không thể tự duyệt</strong> nội dung do chính mình soạn — hệ thống chặn ở
        máy chủ. Đây là quy tắc bốn mắt: mỗi nội dung phải có ít nhất hai người nhìn qua trước
        khi tới tay người học.
      </Alert>

      {!data || data.length === 0 ? (
        <Card>
          <EmptyState
            title="Hàng chờ trống"
            body="Không có nội dung nào đang chờ duyệt. Khi cộng tác viên gửi bài lên, chúng sẽ xuất hiện ở đây."
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {data.map((task) => (
            <li key={task._id}>
              <Card className={cn('p-4', task.isOverdue && 'ring-1 ring-yamabuki-300')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ai-50 px-2.5 py-1 text-xs font-medium text-ai-500">
                    {TYPE_LABEL[task.targetType] ?? task.targetType}
                  </span>
                  {task.isOverdue && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yamabuki-50 px-2.5 py-1 text-xs font-medium text-yamabuki-800">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      Quá hạn duyệt
                    </span>
                  )}
                  <span className="ml-auto text-xs text-sumi-muted">
                    {task.submittedBy?.profile?.displayName ?? 'Không rõ người gửi'}
                  </span>
                </div>

                {task.content ? (
                  <dl className="mt-3 space-y-1.5 text-sm">
                    {Object.entries(task.content)
                      .filter(([k, v]) => VISIBLE_FIELDS.has(k) && v !== null && v !== '')
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="w-28 shrink-0 text-sumi-muted">{FIELD_LABEL[k] ?? k}</dt>
                          <dd
                            className={cn(
                              'min-w-0 flex-1 text-sumi',
                              JAPANESE_FIELDS.has(k) && 'font-jp text-base',
                            )}
                          >
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-beni">
                    Nội dung gốc đã bị xoá — nên từ chối tác vụ này.
                  </p>
                )}

                {openNote === task._id && (
                  <div className="mt-3">
                    <label
                      htmlFor={`note-${task._id}`}
                      className="mb-1 block text-sm font-medium text-sumi"
                    >
                      Ghi chú cho người soạn (bắt buộc khi từ chối hoặc yêu cầu sửa)
                    </label>
                    <textarea
                      id={`note-${task._id}`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Ví dụ: Cách đọc của từ này chưa đúng, nên là..."
                      className="w-full rounded-xl border border-[#E8E2D9] bg-white p-3 text-sumi placeholder:text-sumi-muted focus:border-sakura-400 focus:outline-none focus:ring-2 focus:ring-sakura-100"
                    />
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => submit(task._id, 'approve')}
                    disabled={decide.isRunning}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => submit(task._id, 'request_changes')}
                    disabled={decide.isRunning}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Yêu cầu sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => submit(task._id, 'reject')}
                    disabled={decide.isRunning}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Từ chối
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Chỉ hiện các trường có ý nghĩa với người duyệt.
 *
 * Bản ghi thô có hàng chục trường kỹ thuật (_id, version, timestamps, mảng
 * furigana…). Đổ hết ra màn hình thì người duyệt phải lọc bằng mắt, và sẽ bỏ
 * sót đúng chỗ cần soi.
 */
const VISIBLE_FIELDS = new Set([
  'word', 'reading', 'meaningsVi', 'partOfSpeech', 'jlptLevel', 'topics',
  'pattern', 'titleVi', 'meaningVi', 'formation', 'usageNotes', 'category',
  'japanese', 'translationVi', 'literalVi', 'vietnameseEquivalent',
]);

const JAPANESE_FIELDS = new Set(['word', 'reading', 'pattern', 'formation', 'japanese']);

const FIELD_LABEL: Record<string, string> = {
  word: 'Từ',
  reading: 'Cách đọc',
  meaningsVi: 'Nghĩa',
  partOfSpeech: 'Từ loại',
  jlptLevel: 'Cấp độ',
  topics: 'Chủ đề',
  pattern: 'Mẫu câu',
  titleVi: 'Tên gọi',
  meaningVi: 'Ý nghĩa',
  formation: 'Cấu trúc',
  usageNotes: 'Ghi chú',
  category: 'Nhóm',
  japanese: 'Tiếng Nhật',
  translationVi: 'Bản dịch',
  literalVi: 'Nghĩa đen',
  vietnameseEquivalent: 'Tục ngữ Việt tương đương',
};
