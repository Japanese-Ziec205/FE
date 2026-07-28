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
  /**
   * Bốn lựa chọn cho chế độ trắc nghiệm, đã xáo trộn sẵn ở máy chủ.
   *
   * `null` khi kho chữ chưa đủ để gom ba phương án nhiễu khác biệt — lúc đó
   * giao diện tự lùi về chế độ thẻ lật. Đáp án đúng nằm trong `content.answer`,
   * không được đánh dấu riêng ở đây.
   */
  choices: string[] | null;
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

// ---------------------------------------------------------------------------
// Thi thử JLPT
// ---------------------------------------------------------------------------

export interface ExamPassage {
  title: string;
  body: string;
}

export interface ExamQuestion {
  order: number;
  mondaiCode: string;
  format: 'mcq_single' | 'sentence_order' | string;
  stem: string;
  passage: ExamPassage | null;
  /** Dạng sắp xếp câu: các mảnh ĐÃ xáo trộn. Thứ tự đúng không bao giờ gửi xuống. */
  pieces: string[] | null;
  starPosition: number | null;
  options: { id: string; text: string }[];
  userAnswer: unknown;
  flaggedByUser: boolean;
}

export interface ExamSection {
  code: string;
  nameVi: string;
  durationMinutes: number;
  startedAt: string | null;
  endedAt: string | null;
  lockedByTimeout: boolean;
  questions: ExamQuestion[];
}

export interface ExamAttempt {
  attemptId: string;
  code: string;
  status: 'in_progress' | 'graded' | 'abandoned';
  currentSectionCode: string | null;
  /** Mốc thời gian của MÁY CHỦ — đồng hồ máy người dùng không đáng tin. */
  serverTime: string;
  sectionDeadline: string | null;
  totalRequired?: number;
  sections: ExamSection[];
}

export interface ExamGenerated {
  attemptId: string;
  code: string;
  levelCode: string;
  totalDurationMinutes: number;
  totalQuestions: number;
  overlapRatio: number;
  sections: { code: string; nameVi: string; durationMinutes: number; questionCount: number }[];
  totalRequired: number;
  maxTotal: number;
}

export interface ExamSectionScore {
  code: string;
  nameVi: string;
  raw: number;
  rawTotal: number;
  scaled: number;
  maxScaled: number;
  minRequired: number;
  passed: boolean;
}

export interface ExamResult {
  scaledScore: number;
  totalRequired: number;
  maxTotal: number;
  passed: boolean;
  failReason: 'total_below' | 'section_below' | null;
  failExplanation: string | null;
  sectionScores: ExamSectionScore[];
  byMondai: { code: string; nameVi: string; correct: number; total: number; correctRate: number }[];
  weakMondai: { code: string; nameVi: string; correct: number; total: number }[];
  strongMondai: { code: string; nameVi: string; correct: number; total: number }[];
  skillRadar: Record<string, number>;
  recommendations: { type: string; reason: string; priority: number }[];
}

export interface ExamReviewQuestion {
  order: number;
  mondaiCode: string;
  format: string;
  stem: string;
  passage: ExamPassage | null;
  correctSequence: string[] | null;
  options: { id: string; text: string }[];
  correctOptionIds: string[];
  explanationVi: string;
  userAnswer: unknown;
  isCorrect: boolean | null;
}

export type ExamReview = { code: string; nameVi: string; questions: ExamReviewQuestion[] }[];

export interface ExamHistoryItem {
  attemptId: string;
  code: string;
  levelCode: string;
  submittedAt: string;
  scaledScore: number;
  passed: boolean;
}

export interface PoolHealth {
  levelCode: string;
  canGenerate: boolean;
  overallStatus: 'healthy' | 'warning' | 'insufficient';
  mondai: {
    code: string;
    nameVi: string;
    required: number;
    available: number;
    recommendedMin: number;
    status: 'healthy' | 'warning' | 'insufficient';
    message: string | null;
  }[];
}

// ---------------------------------------------------------------------------
// Quản trị nội dung (CMS)
// ---------------------------------------------------------------------------

export type ContentType = 'vocabulary' | 'grammar' | 'sentence' | 'kanji' | 'kana' | 'kotowaza';

export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';

/**
 * Bản ghi nội dung ở dạng chung.
 *
 * Mỗi loại nội dung có trường riêng (word/pattern/character…), nên chỉ khai báo
 * phần chung rồi cho phép truy cập trường tuỳ ý — giao diện danh sách chỉ cần
 * nhãn, trạng thái và cấp độ.
 */
export interface ContentItem {
  _id: string;
  status: ContentStatus;
  jlptLevel?: string;
  version?: number;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewTask {
  _id: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  status: string;
  submittedBy?: { displayName?: string } | string | null;
  createdAt: string;
}

export interface FuriganaSegment {
  text: string;
  reading: string | null;
}

export interface VocabularyItem {
  _id: string;
  word: string;
  reading: string;
  meaningsVi: string[];
  partOfSpeech: string[];
  topics: string[];
  jlptLevel: string;
  furiganaSegments: FuriganaSegment[];
}

export interface VocabularyList {
  level: string;
  page: number;
  limit: number;
  total: number;
  topics: string[];
  items: VocabularyItem[];
}
