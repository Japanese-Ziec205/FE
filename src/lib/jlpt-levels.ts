/**
 * Thông tin tóm tắt 5 cấp độ JLPT.
 *
 * Các con số (số từ vựng, số Kanji, thời lượng thi) lấy từ tài liệu
 * "Tổng Hợp Ôn Thi JLPT" trong thư mục Document — không phải ước lượng.
 * Kỳ thi JLPT chưa bao giờ công bố danh sách từ vựng chính thức, nên đây là
 * số liệu do giới nghiên cứu dựng lại từ đề thi các năm 2010–2024.
 */

export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

export interface LevelInfo {
  code: JlptLevel;
  nameVi: string;
  tagline: string;
  /** Mô tả năng lực đạt được, viết cho người chưa biết gì về JLPT. */
  canDo: string;
  vocabulary: number;
  kanji: number;
  examMinutes: number;
  /** Số giờ học ước tính để đi từ con số 0 tới cấp này. */
  studyHours: string;
  accent: 'matcha' | 'ai' | 'yamabuki' | 'sakura' | 'sumi';
}

export const LEVEL_INFO: Record<JlptLevel, LevelInfo> = {
  N5: {
    code: 'N5',
    nameVi: 'Sơ cấp',
    tagline: 'Viên gạch đầu tiên',
    canDo:
      'Đọc được Hiragana, Katakana và khoảng 100 chữ Kanji cơ bản. Hiểu và nói được những câu giao tiếp đơn giản hằng ngày.',
    vocabulary: 800,
    kanji: 100,
    examMinutes: 90,
    studyHours: '250–400 giờ',
    accent: 'matcha',
  },
  N4: {
    code: 'N4',
    nameVi: 'Sơ trung cấp',
    tagline: 'Cây cầu nối',
    canDo:
      'Kể lại được kinh nghiệm và mong muốn của bản thân. Hiểu hội thoại chậm về chủ đề quen thuộc, đọc được đoạn văn ngắn có Kanji thường gặp.',
    vocabulary: 1500,
    kanji: 300,
    examMinutes: 115,
    studyHours: '500–800 giờ',
    accent: 'ai',
  },
  N3: {
    code: 'N3',
    nameVi: 'Trung cấp',
    tagline: 'Bước nhảy vọt',
    canDo:
      'Đọc được báo phổ thông và bảng chỉ dẫn nơi công cộng. Nắm được ý chính của hội thoại tốc độ gần tự nhiên.',
    vocabulary: 3750,
    kanji: 650,
    examMinutes: 140,
    studyHours: '900–1200 giờ',
    accent: 'yamabuki',
  },
  N2: {
    code: 'N2',
    nameVi: 'Tiền cao cấp',
    tagline: 'Ngưỡng đi làm',
    canDo:
      'Đọc được bài báo phân tích, tạp chí kinh tế và văn bản công việc. Đây là mốc phần lớn công ty Nhật yêu cầu khi tuyển dụng.',
    vocabulary: 6000,
    kanji: 1000,
    examMinutes: 155,
    studyHours: '1600–2200 giờ',
    accent: 'sakura',
  },
  N1: {
    code: 'N1',
    nameVi: 'Cao cấp',
    tagline: 'Ngang trí thức bản xứ',
    canDo:
      'Đọc được tiểu thuyết, văn bản học thuật và luận văn trừu tượng. Làm chủ toàn bộ 2.136 chữ Hán thường dụng.',
    vocabulary: 10000,
    kanji: 2136,
    examMinutes: 165,
    studyHours: '3000–4800 giờ',
    accent: 'sumi',
  },
};

export const LEVEL_LIST: LevelInfo[] = JLPT_LEVELS.map((code) => LEVEL_INFO[code]);

/** `true` nếu `level` dễ hơn hoặc bằng `ceiling`. */
export function isAtOrBelow(level: JlptLevel, ceiling: JlptLevel): boolean {
  return JLPT_LEVELS.indexOf(level) <= JLPT_LEVELS.indexOf(ceiling);
}
