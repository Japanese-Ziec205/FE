'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Check, Plus, X } from 'lucide-react';

import { api } from '@/lib/api-client';
import { useApi, useAction } from '@/hooks/useApi';
import { useStudyTracker } from '@/hooks/useStudyTracker';
import type {
  EnrollResult,
  GrammarList,
  KanaChart,
  KanaGroup,
  KanaItem,
  KanjiItem,
  Paginated,
  SrsItemType,
  VocabularyList,
} from '@/lib/learn-types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States';
import { cn } from '@/lib/utils';

type Tab = 'hiragana' | 'katakana' | 'kanji' | 'tu-vung' | 'ngu-phap';

const TABS: { id: Tab; label: string }[] = [
  { id: 'hiragana', label: 'Hiragana' },
  { id: 'katakana', label: 'Katakana' },
  { id: 'kanji', label: 'Kanji N5' },
  { id: 'tu-vung', label: 'Từ vựng N5' },
  { id: 'ngu-phap', label: 'Ngữ pháp N5' },
];

const KANA_GROUP_LABEL: Record<KanaGroup, string> = {
  gojuon: 'Bảng gốc (Gojūon)',
  dakuten: 'Âm đục (Dakuten)',
  handakuten: 'Âm nửa đục (Handakuten)',
  yoon: 'Âm ghép (Yōon)',
  special: 'Đặc biệt',
};

export default function StudyPage() {
  useStudyTracker('practice');

  const [tab, setTab] = useState<Tab>('hiragana');

  /**
   * Các mục đang chọn để thêm vào bộ ôn.
   *
   * Khoá dạng `${itemType}:${itemKey}` để một Set duy nhất chứa được cả kana lẫn
   * kanji mà không lẫn nhau — 日 là kanji chứ không phải kana, nhưng nếu chỉ lưu
   * ký tự thì hai loại sẽ đè lên nhau.
   */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = (type: SrsItemType, key: string) => {
    setNotice(null);
    setSelected((prev) => {
      const next = new Set(prev);
      const id = `${type}:${key}`;
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enroll = useAction((ids: string[]) => {
    const items = ids.map((id) => {
      const separator = id.indexOf(':');
      return {
        itemType: id.slice(0, separator) as SrsItemType,
        itemKey: id.slice(separator + 1),
      };
    });
    return api.post<EnrollResult>('/srs/enroll', { items });
  });

  const handleEnroll = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const result = await enroll.run(ids);
    if (result) {
      setNotice(result.message);
      setSelected(new Set());
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-sumi">Học bài</h1>
        <p className="mt-1 text-sumi-muted">
          Chọn những chữ bạn muốn học rồi thêm vào bộ ôn tập. Hệ thống sẽ nhắc bạn ôn lại
          đúng lúc sắp quên.
        </p>
      </header>

      <div role="tablist" aria-label="Nội dung học" className="flex flex-wrap gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'tap-target rounded-xl px-4 text-sm font-semibold transition',
              tab === id
                ? 'bg-sakura-500 text-white shadow-sm'
                : 'bg-white text-sumi-muted ring-1 ring-[#E8E2D9] hover:bg-sakura-50',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {enroll.error && <Alert tone="error">{enroll.error}</Alert>}

      {tab === 'hiragana' && <KanaPanel script="hiragana" selected={selected} onToggle={toggle} />}
      {tab === 'katakana' && <KanaPanel script="katakana" selected={selected} onToggle={toggle} />}
      {tab === 'kanji' && <KanjiPanel selected={selected} onToggle={toggle} />}
      {tab === 'tu-vung' && <VocabularyPanel selected={selected} onToggle={toggle} />}
      {tab === 'ngu-phap' && <GrammarPanel />}

      {/*
        Thanh hành động nổi ở đáy màn hình.

        Bảng chữ cái dài hơn một màn hình rất nhiều. Đặt nút "Thêm vào ôn tập" ở
        cuối trang thì người vừa chọn chữ ở đầu bảng phải cuộn hết trang mới bấm
        được, và phần lớn sẽ tưởng là không có nút.

        bottom-16 trên điện thoại để không nằm đè lên thanh tab dưới cùng.
      */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 md:bottom-6">
          <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl bg-sumi px-4 py-3 text-white shadow-lg">
            <span className="flex-1 text-sm font-medium">Đã chọn {selected.size} mục</span>
            <button
              onClick={() => setSelected(new Set())}
              aria-label="Bỏ chọn tất cả"
              className="tap-target inline-flex items-center justify-center rounded-xl px-2 text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <Button size="sm" onClick={handleEnroll} isLoading={enroll.isRunning}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm vào ôn tập
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bảng chữ cái
// ---------------------------------------------------------------------------

function KanaPanel({
  script,
  selected,
  onToggle,
}: {
  script: 'hiragana' | 'katakana';
  selected: Set<string>;
  onToggle: (type: SrsItemType, key: string) => void;
}) {
  const { data, error, isLoading, reload } = useApi<KanaChart>(
    `/public/kana/chart?script=${script}`,
  );
  const [detail, setDetail] = useState<KanaItem | null>(null);

  if (isLoading) return <Spinner label="Đang tải bảng chữ cái..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.total === 0) {
    return (
      <EmptyState
        title="Kho chữ đang trống"
        body="Dữ liệu bảng chữ cái chưa được nạp. Vui lòng quay lại sau ít phút."
      />
    );
  }

  const groups = (Object.keys(KANA_GROUP_LABEL) as KanaGroup[]).filter(
    (g) => data.groups[g]?.length > 0,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-sumi-muted">
        Bấm vào một chữ để xem mẹo nhớ và ví dụ. Bấm dấu <span aria-hidden="true">+</span> ở góc
        để chọn chữ đó vào bộ ôn tập.
      </p>

      {groups.map((group) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sumi-muted">
            {KANA_GROUP_LABEL[group]}
            <span className="ml-2 font-normal normal-case">({data.groups[group].length} chữ)</span>
          </h2>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {data.groups[group].map((kana) => {
              const isSelected = selected.has(`kana:${kana.character}`);
              return (
                <div key={kana._id} className="relative">
                  <button
                    onClick={() => setDetail(kana)}
                    aria-label={`${kana.character}, đọc là ${kana.romaji}. Xem chi tiết.`}
                    className={cn(
                      'aspect-square w-full rounded-2xl bg-white p-2 ring-1 transition',
                      'hover:-translate-y-0.5 hover:shadow-card-hover',
                      isSelected ? 'ring-2 ring-sakura-500' : 'ring-[#E8E2D9]',
                    )}
                  >
                    <span className="block font-jp text-2xl text-sumi sm:text-3xl">
                      {kana.character}
                    </span>
                    <span className="mt-0.5 block text-xs text-sumi-muted">{kana.romaji}</span>
                  </button>

                  {/*
                    Nút chọn là <button> riêng đặt chồng lên, KHÔNG lồng trong nút
                    xem chi tiết — HTML cấm lồng button trong button, và trình
                    duyệt sẽ tự tháo cấu trúc đó ra làm hỏng cả hai.
                  */}
                  <button
                    onClick={() => onToggle('kana', kana.character)}
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Bỏ ${kana.character} khỏi bộ ôn tập`
                        : `Thêm ${kana.character} vào bộ ôn tập`
                    }
                    className={cn(
                      'absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full transition',
                      isSelected
                        ? 'bg-sakura-500 text-white'
                        : 'bg-black/10 text-white hover:bg-sakura-400',
                    )}
                  >
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {detail && <KanaDetail kana={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function KanaDetail({ kana, onClose }: { kana: KanaItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <Card
        className="w-full max-w-md rounded-b-none p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-jp text-6xl text-sumi">{kana.character}</p>
            <p className="mt-1 text-lg font-semibold text-sakura-600">{kana.romaji}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="tap-target rounded-xl px-2 text-sumi-muted hover:bg-black/5"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-sumi">Số nét</dt>
            <dd className="text-sumi-muted">{kana.strokeCount} nét</dd>
          </div>

          {kana.mnemonicVi && (
            <div>
              <dt className="font-medium text-sumi">Mẹo nhớ</dt>
              <dd className="text-sumi-muted">{kana.mnemonicVi}</dd>
            </div>
          )}

          {kana.similarTo && kana.similarTo.length > 0 && (
            <div>
              <dt className="font-medium text-sumi">Dễ nhầm với</dt>
              <dd className="font-jp text-lg text-sumi-muted">{kana.similarTo.join('   ')}</dd>
            </div>
          )}

          {kana.exampleWords && kana.exampleWords.length > 0 && (
            <div>
              <dt className="font-medium text-sumi">Ví dụ</dt>
              <dd className="space-y-1">
                {kana.exampleWords.map((w) => (
                  <p key={w.word} className="text-sumi-muted">
                    <span className="font-jp text-base text-sumi">{w.word}</span>
                    {' — '}
                    {w.meaningVi}
                  </p>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanji
// ---------------------------------------------------------------------------

function KanjiPanel({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (type: SrsItemType, key: string) => void;
}) {
  const { data, error, isLoading, reload } = useApi<Paginated<KanjiItem>>(
    '/public/kanji?level=N5&limit=120',
  );

  if (isLoading) return <Spinner label="Đang tải Kanji..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="Chưa có Kanji" body="Kho Kanji chưa được nạp dữ liệu." />;
  }

  return (
    <div>
      <p className="mb-3 text-sm text-sumi-muted">
        {data.total} chữ Kanji cấp N5. Âm Hán-Việt là lợi thế riêng của người Việt — nhớ được
        âm này thì đoán nghĩa nhanh hơn hẳn.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((kanji) => {
          const isSelected = selected.has(`kanji:${kanji.character}`);
          return (
            <Card key={kanji._id} className={cn('p-4', isSelected && 'ring-2 ring-sakura-500')}>
              <div className="flex items-start gap-3">
                <span className="font-jp text-4xl leading-none text-sumi">{kanji.character}</span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ai-500">{kanji.sinoVietnamese}</p>
                  <p className="truncate text-sm text-sumi-muted">{kanji.meaningsVi.join(', ')}</p>
                </div>

                <button
                  onClick={() => onToggle('kanji', kanji.character)}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected
                      ? `Bỏ ${kanji.character} khỏi bộ ôn tập`
                      : `Thêm ${kanji.character} vào bộ ôn tập`
                  }
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
                    isSelected
                      ? 'bg-sakura-500 text-white'
                      : 'bg-black/5 text-sumi-muted hover:bg-sakura-100',
                  )}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              <dl className="mt-3 space-y-1 text-xs text-sumi-muted">
                {kanji.readings.onyomi.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium">Âm ON</dt>
                    <dd className="font-jp">
                      {kanji.readings.onyomi.map((r) => r.kana).join(' · ')}
                    </dd>
                  </div>
                )}
                {kanji.readings.kunyomi.length > 0 && (
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium">Âm KUN</dt>
                    <dd className="font-jp">
                      {kanji.readings.kunyomi.map((r) => r.kana).join(' · ')}
                    </dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="shrink-0 font-medium">Số nét</dt>
                  <dd>{kanji.strokeCount}</dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Từ vựng
// ---------------------------------------------------------------------------

function VocabularyPanel({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (type: SrsItemType, key: string) => void;
}) {
  const [topic, setTopic] = useState('');
  const path = useMemo(() => {
    const params = new URLSearchParams({ level: 'N5', limit: '200' });
    if (topic) params.set('topic', topic);
    return `/public/vocabulary?${params.toString()}`;
  }, [topic]);

  const { data, error, isLoading, reload } = useApi<VocabularyList>(path);

  if (isLoading) return <Spinner label="Đang tải từ vựng..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="Chưa có từ vựng" body="Kho từ vựng chưa được nạp dữ liệu." />;
  }

  return (
    <div>
      {/*
        Lọc theo chủ đề vì học từ theo cụm nghĩa (gia đình, thời tiết, đồ ăn)
        dễ nhớ hơn nhiều so với học một danh sách xếp theo bảng chữ cái.
      */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="chu-de" className="text-sm text-sumi-muted">
          Chủ đề
        </label>
        <select
          id="chu-de"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="h-10 rounded-xl border border-[#E8E2D9] bg-white px-3 text-sm text-sumi focus:border-sakura-400 focus:outline-none"
        >
          <option value="">Tất cả ({data.total} từ)</option>
          {data.topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((v) => {
          const isSelected = selected.has(`vocabulary:${v._id}`);
          return (
            <Card key={v._id} className={cn('p-4', isSelected && 'ring-2 ring-sakura-500')}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-jp text-2xl text-sumi">{v.word}</p>
                  <p className="font-jp text-sm text-sakura-600">{v.reading}</p>
                  <p className="mt-1 text-sm text-sumi-muted">{v.meaningsVi.join(', ')}</p>
                  {v.topics.length > 0 && (
                    <p className="mt-1.5 text-xs text-sumi-muted">{v.topics.join(' · ')}</p>
                  )}
                </div>

                {/*
                  Khoá của thẻ từ vựng là _id chứ không phải chữ viết: backend
                  tra từ vựng theo ObjectId, khác với kana/kanji tra theo ký tự.
                */}
                <button
                  onClick={() => onToggle('vocabulary', v._id)}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected
                      ? `Bỏ ${v.word} khỏi bộ ôn tập`
                      : `Thêm ${v.word} vào bộ ôn tập`
                  }
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
                    isSelected
                      ? 'bg-sakura-500 text-white'
                      : 'bg-black/5 text-sumi-muted hover:bg-sakura-100',
                  )}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ngữ pháp
// ---------------------------------------------------------------------------

function GrammarPanel() {
  const { data, error, isLoading, reload } = useApi<GrammarList>('/public/grammar?level=N5');

  const byCategory = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, GrammarList['items']>();
    for (const item of data.items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [data]);

  if (isLoading) return <Spinner label="Đang tải ngữ pháp..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="Chưa có mẫu ngữ pháp"
        body="Kho ngữ pháp đang được biên soạn."
        icon={<BookOpen className="h-10 w-10" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {byCategory.map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sumi-muted">
            {category}
          </h2>
          <div className="space-y-3">
            {items.map((g) => (
              <Card key={g._id} className="p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-jp text-xl font-semibold text-sakura-600">{g.pattern}</span>
                  <span className="font-medium text-sumi">{g.titleVi}</span>
                </div>
                <p className="mt-2 text-sumi-muted">{g.meaningVi}</p>
                <p className="mt-2 rounded-xl bg-black/5 px-3 py-2 font-jp text-sm text-sumi">
                  {g.formation}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
