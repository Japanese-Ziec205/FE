'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eraser, Eye, EyeOff, Undo2 } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import type { KanaChart, KanaItem } from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

type Point = { x: number; y: number };
type Stroke = Point[];

const CANVAS_SIZE = 320;

export default function WritingPage() {
  const [script, setScript] = useState<'hiragana' | 'katakana'>('hiragana');
  const { data, error, isLoading, reload } = useApi<KanaChart>(
    `/public/kana/chart?script=${script}`,
  );

  const [index, setIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);

  // Chỉ luyện bảng gốc: âm đục và âm ghép chỉ là bảng gốc thêm dấu hoặc ghép
  // đôi, không có nét mới nào để tập.
  const chars: KanaItem[] = data?.groups.gojuon ?? [];
  const current = chars[index] ?? null;

  if (isLoading) return <Spinner label="Đang tải bảng chữ cái..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-sumi">Luyện viết</h1>
        <p className="mt-1 text-sumi-muted">
          Viết tay giúp nhớ mặt chữ lâu hơn hẳn so với chỉ nhìn. Dùng ngón tay trên điện thoại
          hoặc chuột trên máy tính.
        </p>
      </header>

      {/*
        Nói thẳng giới hạn thay vì để người dùng chờ một tính năng không có.
        Chấm từng nét cần dữ liệu thứ tự nét KanjiVG, hiện chưa nạp vào hệ thống.
      */}
      <Alert tone="info">
        Phần chấm điểm từng nét đang được xây dựng. Hiện tại bạn tự đối chiếu với chữ mẫu mờ
        phía dưới — vẫn là cách luyện tay rất hiệu quả.
      </Alert>

      <div role="tablist" aria-label="Chọn bảng chữ" className="flex gap-2">
        {(['hiragana', 'katakana'] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={script === s}
            onClick={() => {
              // Đặt lại vị trí ngay trong handler thay vì qua effect: đổi bảng
              // chữ mà giữ nguyên index sẽ nhảy tới một chữ ngẫu nhiên.
              setScript(s);
              setIndex(0);
            }}
            className={cn(
              'tap-target rounded-xl px-4 text-sm font-semibold capitalize transition',
              script === s
                ? 'bg-sakura-500 text-white shadow-sm'
                : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-sakura-50',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {current ? (
        <Card className="flex flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Chữ trước"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>

            <div className="text-center">
              <p className="font-jp text-3xl text-sumi">{current.character}</p>
              <p className="text-sm text-sumi-muted">
                {current.romaji} · {current.strokeCount} nét
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex((i) => Math.min(chars.length - 1, i + 1))}
              disabled={index >= chars.length - 1}
              aria-label="Chữ tiếp theo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          {/*
            `key` khiến React gắn lại component khi đổi chữ, tự động xoá sạch
            nét cũ. Gọn hơn hẳn việc dùng effect để dọn state thủ công.
          */}
          <WritingCanvas
            key={current.character}
            character={current.character}
            showGuide={showGuide}
          />

          <div className="flex w-full items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGuide((v) => !v)}>
              {showGuide ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              {showGuide ? 'Ẩn chữ mẫu' : 'Hiện chữ mẫu'}
            </Button>
          </div>

          <p className="text-center text-sm text-sumi-muted">
            Chữ {index + 1} / {chars.length}
          </p>

          {current.mnemonicVi && (
            <p className="rounded-xl bg-washi px-4 py-3 text-center text-sm text-sumi-muted">
              💡 {current.mnemonicVi}
            </p>
          )}
        </Card>
      ) : (
        <Card className="py-10 text-center text-sumi-muted">
          Chưa có chữ nào để luyện. Kho dữ liệu có thể chưa được nạp.
        </Card>
      )}
    </div>
  );
}

/**
 * Bảng viết tay.
 *
 * Lưu nét dưới dạng mảng toạ độ chứ không vẽ thẳng lên canvas rồi quên: có dữ
 * liệu nét mới hoàn tác được từng nét một, và sau này ghép được với bộ chấm nét
 * khi có dữ liệu KanjiVG.
 */
function WritingCanvas({ character, showGuide }: { character: string; showGuide: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawing, setDrawing] = useState<Stroke | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // --- Ô kẻ kiểu 田字格: hai đường chia đôi giúp căn tỉ lệ từng phần chữ ---
    ctx.strokeStyle = '#E8E2D9';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, CANVAS_SIZE - 1, CANVAS_SIZE - 1);

    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.moveTo(0, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Chữ mẫu mờ ---
    if (showGuide) {
      ctx.fillStyle = 'rgba(31, 36, 48, 0.13)';
      ctx.font = `${CANVAS_SIZE * 0.72}px var(--font-jp), sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(character, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + CANVAS_SIZE * 0.03);
    }

    // --- Nét người dùng ---
    ctx.strokeStyle = '#1F2430';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const all = drawing ? [...strokes, drawing] : strokes;
    for (const stroke of all) {
      if (stroke.length < 2) {
        // Một chạm đơn vẫn phải để lại dấu chấm, nếu không người dùng tưởng hỏng
        if (stroke.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke[0].x, stroke[0].y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#1F2430';
          ctx.fill();
        }
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const p of stroke.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, [character, showGuide, strokes, drawing]);

  // Canvas phải khớp devicePixelRatio, nếu không nét sẽ mờ nhoè trên màn retina
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    redraw();
  }, [redraw]);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Canvas hiển thị co giãn theo bề ngang màn hình nên phải quy đổi tỉ lệ
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  };

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: CANVAS_SIZE, aspectRatio: '1 / 1' }}
        // touch-none là bắt buộc: thiếu nó, kéo ngón tay sẽ cuộn trang thay vì vẽ
        className="mx-auto block touch-none rounded-2xl bg-white"
        aria-label={`Bảng tập viết chữ ${character}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrawing([pointFrom(e)]);
        }}
        onPointerMove={(e) => {
          if (!drawing) return;
          const p = pointFrom(e);
          setDrawing((s) => (s ? [...s, p] : [p]));
        }}
        onPointerUp={() => {
          if (drawing) setStrokes((prev) => [...prev, drawing]);
          setDrawing(null);
        }}
        // Ngón tay trượt ra ngoài khung vẫn phải chốt nét lại, không thì nét bay mất
        onPointerLeave={() => {
          if (drawing) setStrokes((prev) => [...prev, drawing]);
          setDrawing(null);
        }}
      />

      <div className="mt-3 flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStrokes((s) => s.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          Hoàn tác nét
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStrokes([])}
          disabled={strokes.length === 0}
        >
          <Eraser className="h-4 w-4" aria-hidden="true" />
          Xoá hết
        </Button>
      </div>

      <p className="mt-2 text-center text-sm text-sumi-muted">
        Đã viết {strokes.length} nét
      </p>
    </div>
  );
}
