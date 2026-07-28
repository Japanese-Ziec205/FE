'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, ChevronRight, Flag, Timer } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi } from '@/hooks/useApi';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import type { ExamAttempt, ExamQuestion, ExamSection } from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

export default function ExamRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const attemptId = params.id;

  useStudyTracker('exam');

  const path = useMemo(() => `/exams/attempts/${attemptId}`, [attemptId]);
  const { data, error, isLoading, reload } = useApi<ExamAttempt>(path);

  if (isLoading) return <Spinner label="Đang mở phòng thi..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  if (data.status === 'graded') {
    router.replace(`/thi-thu/${attemptId}/ket-qua`);
    return <Spinner label="Bài đã nộp, đang chuyển sang kết quả..." />;
  }

  return <ExamRoom attempt={data} onReload={reload} />;
}

function ExamRoom({ attempt, onReload }: { attempt: ExamAttempt; onReload: () => void }) {
  const router = useRouter();

  // Phần thi đang mở: phần chưa kết thúc đầu tiên
  const activeSection = attempt.sections.find((s) => !s.endedAt) ?? null;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Nạp đáp án đã lưu trên máy chủ (người dùng có thể đã làm dở rồi tải lại trang)
  const [syncedFrom, setSyncedFrom] = useState<ExamSection | null>(null);
  if (activeSection && activeSection !== syncedFrom) {
    setSyncedFrom(activeSection);
    const restored: Record<number, string> = {};
    const restoredFlags = new Set<number>();
    for (const q of activeSection.questions) {
      if (typeof q.userAnswer === 'string') restored[q.order] = q.userAnswer;
      if (q.flaggedByUser) restoredFlags.add(q.order);
    }
    setAnswers(restored);
    setFlags(restoredFlags);
    setIndex(0);
  }

  /**
   * Gửi toàn bộ đáp án của phần đang làm lên máy chủ.
   *
   * Khai báo TRƯỚC mọi lệnh return sớm: hook phải được gọi cùng thứ tự ở mọi
   * lần render, đặt sau nhánh `if (!activeSection) return` sẽ vi phạm quy tắc.
   */
  const saveAll = useCallback(async () => {
    if (!activeSection) return;
    const payload = activeSection.questions.map((q) => ({
      order: q.order,
      answer: answers[q.order] ?? null,
      flagged: flags.has(q.order),
    }));
    await api.patch(`/exams/attempts/${attempt.attemptId}/answers`, {
      sectionCode: activeSection.code,
      answers: payload,
    });
  }, [activeSection, answers, flags, attempt.attemptId]);

  if (!activeSection) {
    return (
      <SubmitPanel
        attemptId={attempt.attemptId}
        onDone={() => router.replace(`/thi-thu/${attempt.attemptId}/ket-qua`)}
      />
    );
  }

  const started = Boolean(activeSection.startedAt);
  const question = activeSection.questions[index];

  const startSection = async () => {
    setBusy(true);
    try {
      await api.post(`/exams/attempts/${attempt.attemptId}/sections/${activeSection.code}/start`);
      onReload();
    } finally {
      setBusy(false);
    }
  };

  const finishSection = async () => {
    setBusy(true);
    try {
      await saveAll();
      await api.post(`/exams/attempts/${attempt.attemptId}/sections/${activeSection.code}/finish`);
      onReload();
    } catch {
      setNotice('Không kết thúc được phần thi. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Chưa bắt đầu phần thi: hiện màn chuẩn bị ----
  if (!started) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <Timer className="mx-auto h-10 w-10 text-sakura-500" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-sumi">{activeSection.nameVi}</h1>
        <p className="mt-2 text-sumi-muted">
          {activeSection.questions.length} câu · {activeSection.durationMinutes} phút
        </p>

        <Alert tone="warning" className="mt-5 text-left">
          Đồng hồ bắt đầu chạy ngay khi bạn bấm nút, và <strong>không dừng lại được</strong>.
          Hết giờ thì phần này tự khoá, không quay lại sửa được — giống kỳ thi thật.
        </Alert>

        <Button className="mt-5" fullWidth size="lg" onClick={startSection} isLoading={busy}>
          Bắt đầu làm bài
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notice && <Alert tone="error">{notice}</Alert>}

      <CountdownBar
        deadline={attempt.sectionDeadline}
        serverTime={attempt.serverTime}
        sectionName={activeSection.nameVi}
        onExpire={finishSection}
      />

      <QuestionNav
        questions={activeSection.questions}
        answers={answers}
        flags={flags}
        current={index}
        onJump={setIndex}
      />

      {question && (
        <QuestionCard
          question={question}
          answer={answers[question.order] ?? null}
          flagged={flags.has(question.order)}
          onAnswer={(value) => setAnswers((a) => ({ ...a, [question.order]: value }))}
          onToggleFlag={() =>
            setFlags((f) => {
              const next = new Set(f);
              if (next.has(question.order)) next.delete(question.order);
              else next.add(question.order);
              return next;
            })
          }
        />
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Câu trước
        </Button>

        {index < activeSection.questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setIndex((i) => i + 1)}>
            Câu tiếp
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={finishSection} isLoading={busy}>
            Nộp phần này
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-sumi-muted">
        Đã trả lời {Object.keys(answers).length}/{activeSection.questions.length} câu
      </p>
    </div>
  );
}

/**
 * Đồng hồ đếm ngược.
 *
 * Mốc hết giờ lấy từ MÁY CHỦ, và độ lệch đồng hồ máy người dùng được trừ đi
 * ngay từ đầu. Nếu chỉ đếm bằng đồng hồ máy thì người chỉnh giờ hệ thống sẽ tự
 * cho mình thêm thời gian — mà bài thi này còn dùng để tự đánh giá, gian lận
 * chỉ hại chính họ, nhưng con số phải trung thực thì mới có ý nghĩa.
 */
function CountdownBar({
  deadline,
  serverTime,
  sectionName,
  onExpire,
}: {
  deadline: string | null;
  serverTime: string;
  sectionName: string;
  onExpire: () => void;
}) {
  const deadlineMs = deadline ? new Date(deadline).getTime() : null;

  /**
   * `null` nghĩa là chưa tính lần nào — đồng hồ chỉ hiện sau nhịp đầu tiên
   * trong effect. Gọi Date.now() lúc render là hàm không thuần khiết, và React
   * Compiler chặn đúng vì lý do đó.
   */
  const [remaining, setRemaining] = useState<number | null>(null);

  // Chỉ gọi onExpire đúng MỘT lần, dù đồng hồ vẫn tiếp tục chạy
  const firedRef = useRef(false);

  useEffect(() => {
    if (!deadlineMs) return;

    // Độ lệch giữa đồng hồ máy chủ và đồng hồ máy người dùng, đo một lần lúc
    // gắn component rồi trừ đi ở mọi phép tính sau đó.
    const skew = new Date(serverTime).getTime() - Date.now();

    const tick = () => {
      const left = Math.max(0, deadlineMs - (Date.now() + skew));
      setRemaining(left);
      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadlineMs, serverTime, onExpire]);

  if (!deadlineMs || remaining === null) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const urgent = totalSeconds <= 300;

  return (
    <div
      className={cn(
        'sticky top-16 z-30 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm',
        urgent ? 'bg-beni text-white' : 'bg-white ring-1 ring-[#E8E2D9]',
      )}
    >
      {urgent ? (
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <Timer className="h-5 w-5 shrink-0 text-sakura-500" aria-hidden="true" />
      )}
      <span className={cn('flex-1 text-sm font-medium', !urgent && 'text-sumi')}>
        {sectionName}
      </span>
      <span
        className={cn('font-mono text-lg font-bold tabular-nums', !urgent && 'text-sumi')}
        role="timer"
        aria-live={urgent ? 'assertive' : 'off'}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

/** Lưới số câu — nhìn một cái là biết còn câu nào chưa làm. */
function QuestionNav({
  questions,
  answers,
  flags,
  current,
  onJump,
}: {
  questions: ExamQuestion[];
  answers: Record<number, string>;
  flags: Set<number>;
  current: number;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, i) => {
        const answered = answers[q.order] !== undefined;
        const flagged = flags.has(q.order);
        return (
          <button
            key={q.order}
            onClick={() => onJump(i)}
            aria-label={`Câu ${q.order}${answered ? ', đã trả lời' : ', chưa trả lời'}${flagged ? ', đã đánh dấu' : ''}`}
            aria-current={i === current ? 'true' : undefined}
            className={cn(
              'relative h-9 w-9 rounded-lg text-sm font-medium transition',
              i === current && 'ring-2 ring-sumi ring-offset-1',
              answered
                ? 'bg-matcha-500 text-white'
                : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9]',
            )}
          >
            {q.order}
            {flagged && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-yamabuki-500"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  flagged,
  onAnswer,
  onToggleFlag,
}: {
  question: ExamQuestion;
  answer: string | null;
  flagged: boolean;
  onAnswer: (value: string) => void;
  onToggleFlag: () => void;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs text-sumi-muted">
          Câu {question.order}
        </span>
        <button
          onClick={onToggleFlag}
          aria-pressed={flagged}
          className={cn(
            'tap-target inline-flex items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition',
            flagged ? 'bg-yamabuki-50 text-yamabuki-800' : 'text-sumi-muted hover:bg-black/5',
          )}
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          {flagged ? 'Đã đánh dấu' : 'Đánh dấu'}
        </button>
      </div>

      {question.passage && (
        <div className="mb-4 rounded-2xl bg-washi p-4">
          {question.passage.title && (
            <h3 className="mb-2 text-sm font-semibold text-sumi-muted">
              {question.passage.title}
            </h3>
          )}
          <p className="whitespace-pre-line font-jp text-lg leading-loose text-sumi">
            {question.passage.body}
          </p>
        </div>
      )}

      <p className="whitespace-pre-line font-jp text-xl leading-relaxed text-sumi">
        {question.stem}
      </p>

      {/*
        Dạng sắp xếp câu: hiện các mảnh để người học nhìn thấy chúng, rồi chọn
        mảnh nào đứng ở vị trí ★. Đây đúng là cách JLPT hỏi — không bắt sắp xếp
        cả câu mà chỉ hỏi một vị trí.
      */}
      {question.pieces && (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.pieces.map((piece) => (
            <span
              key={piece}
              className="rounded-xl bg-black/5 px-3 py-1.5 font-jp text-sumi"
            >
              {piece}
            </span>
          ))}
        </div>
      )}

      <fieldset className="mt-5">
        <legend className="sr-only">Chọn đáp án cho câu {question.order}</legend>
        <div className="space-y-2">
          {(question.pieces ?? []).length > 0
            ? question.pieces!.map((piece, i) => (
                <OptionRow
                  key={piece}
                  id={String(i)}
                  label={String.fromCharCode(65 + i)}
                  text={piece}
                  selected={answer === String(i)}
                  onSelect={onAnswer}
                  name={`q-${question.order}`}
                />
              ))
            : question.options.map((o, i) => (
                <OptionRow
                  key={o.id}
                  id={o.id}
                  label={String.fromCharCode(65 + i)}
                  text={o.text}
                  selected={answer === o.id}
                  onSelect={onAnswer}
                  name={`q-${question.order}`}
                />
              ))}
        </div>
      </fieldset>
    </Card>
  );
}

function OptionRow({
  id,
  label,
  text,
  selected,
  onSelect,
  name,
}: {
  id: string;
  label: string;
  text: string;
  selected: boolean;
  onSelect: (value: string) => void;
  name: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition',
        selected ? 'border-sakura-500 bg-sakura-50' : 'border-[#E8E2D9] hover:bg-black/[0.02]',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={() => onSelect(id)}
        className="sr-only"
      />
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          selected ? 'bg-sakura-500 text-white' : 'bg-black/5 text-sumi-muted',
        )}
        aria-hidden="true"
      >
        {label}
      </span>
      <span className="font-jp text-lg text-sumi">{text}</span>
    </label>
  );
}

function SubmitPanel({ attemptId, onDone }: { attemptId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/exams/attempts/${attemptId}/submit`);
      onDone();
    } catch {
      setError('Không nộp được bài. Kiểm tra kết nối rồi thử lại — đáp án của bạn đã được lưu.');
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto max-w-lg text-center">
      <h1 className="text-xl font-bold text-sumi">Bạn đã làm xong tất cả các phần</h1>
      <p className="mt-2 text-sumi-muted">
        Bấm nộp bài để hệ thống chấm điểm và chỉ ra những phần bạn còn yếu.
      </p>
      {error && (
        <Alert tone="error" className="mt-4 text-left">
          {error}
        </Alert>
      )}
      <Button className="mt-5" fullWidth size="lg" onClick={submit} isLoading={busy}>
        Nộp bài và xem kết quả
      </Button>
    </Card>
  );
}
