/**
 * Hình dạng dữ liệu các API học tập trả về.
 *
 * Được đối chiếu trực tiếp với backend (BE/src/modules/{public,srs,study,
 * gamification}) chứ không đoán, nên tên trường khớp nguyên vẹn — kể cả những
 * chỗ hơi lệch quy ước như `new` trong SrsStats.
 */

// ---------------------------------------------------------------------------
// Kho ngôn ngữ công khai
// ---------------------------------------------------------------------------

export interface KanaItem {
  _id: string;
  character: string;
  romaji: string;
  row: string;
  column: string;
  group: KanaGroup;
  strokeCount: number;
  mnemonicVi?: string;
  similarTo?: string[];
  exampleWords?: { word: string; reading: string; meaningVi: string }[];
}

export type KanaGroup = 'gojuon' | 'dakuten' | 'handakuten' | 'yoon' | 'special';

export interface KanaChart {
  script: 'hiragana' | 'katakana';
  total: number;
  groups: Record<KanaGroup, KanaItem[]>;
}

export interface KanjiReading {
  kana: string;
  romaji: string;
  okurigana: string;
  isCommon: boolean;
}

export interface KanjiItem {
  _id: string;
  character: string;
  jlptLevel: string;
  meaningsVi: string[];
  sinoVietnamese: string;
  strokeCount: number;
  readings: { onyomi: KanjiReading[]; kunyomi: KanjiReading[]; nanori: KanjiReading[] };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface GrammarItem {
  _id: string;
  pattern: string;
  titleVi: string;
  meaningVi: string;
  formation: string;
  category: string;
  jlptLevel: string;
}

export interface GrammarList {
  level: string;
  total: number;
  items: GrammarItem[];
}

export interface Kotowaza {
  _id: string;
  japanese: string;
  reading: string;
  romaji: string;
  literalVi: string;
  meaningVi: string;
  vietnameseEquivalent?: string;
  culturalNote?: string;
}

// ---------------------------------------------------------------------------
// Ôn tập (SRS)
// ---------------------------------------------------------------------------

export type SrsItemType = 'kana' | 'kanji' | 'vocabulary' | 'grammar';
export type SrsRating = 1 | 2 | 3 | 4;

export interface SrsCardContent {
  prompt: string;
  promptType: string;
  answer: string;
  hint?: string;
  extra?: {
    sinoVietnamese?: string;
    readings?: string;
    reading?: string;
    formation?: string;
    title?: string;
  };
}

export interface SrsQueueCard {
  cardId: string;
  itemType: SrsItemType;
  itemKey: string;
  direction: 'recognition' | 'recall' | 'handwriting';
  state: 'new' | 'learning' | 'review' | 'relearning';
  isOverdue: boolean;
  content: SrsCardContent;
  /** Khoá là '1' | '2' | '3' | '4', giá trị là mô tả kiểu "10 phút", "3 ngày". */
  nextIntervals: Record<string, string>;
}

export interface SrsQueue {
  totalDue: number;
  newAvailable: number;
  backlogWarning: boolean;
  backlogMessage: string | null;
  items: SrsQueueCard[];
}

export interface SrsReviewResult {
  xpAwarded: number;
  leveledUp: boolean;
  streak: { current: number; message: string | null };
  achievementsUnlocked: { code: string; nameVi: string }[];
  card: { state: string; intervalDays: number; dueAt: string };
  becameLeech: boolean;
  leechMessage: string | null;
  nextIntervals: Record<string, string>;
}

export interface SrsStats {
  total: number;
  due: number;
  new: number;
  learning: number;
  leeches: number;
  byType: Partial<Record<SrsItemType, number>>;
  forecast: { date: string; count: number }[];
  backlogWarning: boolean;
}

export interface EnrollResult {
  cardsCreated: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Giờ học & thành tích
// ---------------------------------------------------------------------------

export interface StudyToday {
  date: string;
  studySeconds: number;
  studyMinutes: number;
  dailyGoalSeconds: number;
  goalMet: boolean;
  progressPercent: number;
  reviewsDone: number;
  lessonsCompleted: number;
}

export interface StudyHistoryDay {
  date: string;
  studySeconds: number;
  reviewsDone: number;
}

export interface GamificationProfile {
  xp: {
    total: number;
    thisWeek: number;
    today: number;
    dailyCap: number;
    level: number;
    levelTitle: string;
    intoLevel: number;
    neededForNextLevel: number;
    progressPercent: number;
  };
  streak: {
    current: number;
    longest: number;
    lastStudyDate: string | null;
    freezesAvailable: number;
  };
  achievements: { unlocked: number; total: number };
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  code: string;
  nameVi: string;
  descriptionVi: string;
  tier: AchievementTier;
  category: string;
  threshold?: number;
  xpReward?: number;
  isSecret: boolean;
  unlocked: boolean;
  unlockedAt?: string | null;
  progress: number;
}
