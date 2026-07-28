import Link from 'next/link';
import { BookOpen, Heart, PenLine, Sparkles, Timer, Users } from 'lucide-react';
import { Mascot } from '@/components/ui/Mascot';
import { HeroBackdrop } from '@/components/scene/HeroBackdrop';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Bảng chữ cái đầy đủ',
    body: 'Hiragana và Katakana trọn bộ, kèm biến âm và âm ghép. Có hoạt hình thứ tự nét bút và phát âm chuẩn.',
  },
  {
    icon: PenLine,
    title: 'Luyện viết tay',
    body: 'Viết trực tiếp trên màn hình, hệ thống chấm từng nét và chỉ ra bạn sai ở đâu — không chỉ báo đúng hay sai.',
  },
  {
    icon: Timer,
    title: 'Ghi nhận giờ học',
    body: 'Theo dõi chính xác thời gian bạn thực sự tập trung học, đối chiếu với mốc 250–400 giờ của cấp N5.',
  },
  {
    icon: Sparkles,
    title: 'Ôn tập thông minh',
    body: 'Hệ thống lặp lại ngắt quãng nhắc bạn ôn đúng lúc sắp quên, để nhớ lâu mà không tốn sức.',
  },
  {
    icon: Users,
    title: 'Thi thử JLPT',
    body: 'Đề thi sinh tự động theo đúng ma trận thật, chấm theo quy tắc điểm liệt và phân tích điểm yếu của bạn.',
  },
  {
    icon: Heart,
    title: 'Miễn phí mãi mãi',
    body: 'Không thu phí, không quảng cáo, không giới hạn. Dự án phi lợi nhuận dành cho người có hoàn cảnh khó khăn.',
  },
];

const LEVELS = [
  { code: 'N5', label: 'Sơ cấp 1', desc: '~800 từ · 112 Kanji', hours: '250–400 giờ' },
  { code: 'N4', label: 'Sơ cấp 2', desc: '~1.500 từ · 300 Kanji', hours: '~3,5 tháng' },
  { code: 'N3', label: 'Trung cấp', desc: '~3.500 từ · 700 Kanji', hours: '~4,5 tháng' },
  { code: 'N2', label: 'Tiền cao cấp', desc: '~6.000 từ · 1.000 Kanji', hours: '~4,5 tháng' },
  { code: 'N1', label: 'Cao cấp', desc: '~10.000 từ · 2.136 Kanji', hours: '3.100+ giờ' },
];

export default function LandingPage() {
  return (
    <main id="noi-dung-chinh" className="min-h-screen bg-washi">
      {/* ---------- Thanh điều hướng ---------- */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D9] bg-washi/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🌸</span>
            <span className="text-lg font-bold text-sumi">Nihongo Kizuna</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dang-nhap"
              className="tap-target inline-flex items-center rounded-xl px-4 text-sm font-medium text-sumi-muted hover:bg-black/5"
            >
              Đăng nhập
            </Link>
            <Link
              href="/dang-ky"
              className="tap-target inline-flex items-center rounded-xl bg-sakura-500 px-4 text-sm font-semibold text-white hover:bg-sakura-600"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      {/*
        `isolate` là bắt buộc, không phải trang trí.

        HeroBackdrop nằm ở -z-10 để lùi ra sau chữ. Nhưng `relative` không tạo
        ngữ cảnh xếp lớp, nên lớp âm đó thoát khỏi section và bị vẽ ra SAU nền
        `bg-washi` đục của <main>, tức là ảnh nền bị chính nền trang phủ kín.

        `isolate` (isolation: isolate) buộc section tự tạo ngữ cảnh xếp lớp,
        giữ -z-10 nằm trong phạm vi section và nổi lên trên nền của <main>.
      */}
      <section className="relative isolate min-h-[88vh] overflow-hidden">
        <HeroBackdrop />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 md:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-matcha-50 px-3 py-1 text-sm font-medium text-matcha-800">
              <Heart className="h-4 w-4" aria-hidden="true" />
              Phi lợi nhuận · Miễn phí hoàn toàn
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-tight text-sumi sm:text-5xl">
              Học tiếng Nhật <span className="text-sakura-500">từ con số 0</span>
              <br />
              không tốn một đồng
            </h1>

            <p className="mt-5 max-w-xl text-lg text-sumi-muted">
              Lộ trình N5 đến N1 bám sát khung JLPT. Học được trên điện thoại cũ, mạng chậm,
              mỗi ngày chỉ 5 phút cũng tiến bộ.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dang-ky"
                className="inline-flex h-14 items-center rounded-2xl bg-sakura-500 px-7 text-lg font-semibold text-white shadow-sm transition hover:bg-sakura-600 active:scale-[0.98]"
              >
                Bắt đầu học ngay
              </Link>
              <Link
                href="/dang-nhap"
                className="inline-flex h-14 items-center rounded-2xl border-2 border-sakura-500 px-7 text-lg font-semibold text-sakura-600 transition hover:bg-sakura-50 active:scale-[0.98]"
              >
                Tôi đã có tài khoản
              </Link>
            </div>

            <p className="mt-4 text-sm text-sumi-muted">
              Đăng ký bằng email · Không cần thẻ ngân hàng
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-full bg-sakura-100/60 blur-3xl" aria-hidden="true" />
              <Mascot pose="wave" className="h-56 w-56 sm:h-72 sm:w-72" />
            </div>
          </div>
        </div>

        {/* Gợi ý cuộn xuống — phần nội dung chính nằm dưới màn hình đầu tiên */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <span className="animate-float text-sm text-sumi-muted">Cuộn xuống để khám phá ↓</span>
        </div>
      </section>

      {/* ---------- Tính năng ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-bold text-sumi">Hệ thống có gì?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sumi-muted">
          Được xây dựng bám sát nguyên lý sư phạm ngôn ngữ, không phải một kho từ vựng khô khan.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6 transition hover:shadow-card-hover">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sakura-50 text-sakura-600">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-sumi">{title}</h3>
              <p className="mt-2 text-sumi-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Lộ trình ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl font-bold text-sumi">Lộ trình N5 → N1</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sumi-muted">
          Bắt đầu từ bảng chữ cái, tiến dần tới trình độ đọc hiểu văn bản học thuật.
        </p>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LEVELS.map((lv, i) => (
            <li
              key={lv.code}
              className={`card p-5 text-center ${i === 0 ? 'ring-2 ring-sakura-400' : ''}`}
            >
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${
                  i === 0 ? 'bg-sakura-500 text-white' : 'bg-ai-50 text-ai-600'
                }`}
              >
                {lv.code}
              </div>
              <p className="mt-3 font-semibold text-sumi">{lv.label}</p>
              <p className="mt-1 text-sm text-sumi-muted">{lv.desc}</p>
              <p className="mt-2 text-xs text-sumi-muted">{lv.hours}</p>
              {i === 0 && (
                <span className="mt-3 inline-block rounded-full bg-sakura-50 px-3 py-1 text-xs font-medium text-sakura-700">
                  Bắt đầu tại đây
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Kotowaza ---------- */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="card bg-gradient-to-br from-sakura-50 to-yamabuki-50 p-8 text-center">
          <p className="text-jp text-2xl font-bold text-ai-600">継続は力なり</p>
          <p className="mt-2 text-sm text-sumi-muted">keizoku wa chikara nari</p>
          <p className="mt-4 text-lg font-medium text-sumi">Kiên trì chính là sức mạnh</p>
          <p className="mt-2 text-sm text-sumi-muted">
            Mỗi ngày 5 phút, một năm sau bạn sẽ ở một nơi rất khác.
          </p>
        </div>
      </section>

      {/* ---------- Kêu gọi hành động ---------- */}
      <section className="mx-auto max-w-4xl px-4 py-14 text-center">
        <Mascot pose="cheer" className="mx-auto h-28 w-28" />
        <h2 className="mt-4 text-3xl font-bold text-sumi">Sẵn sàng bắt đầu chưa?</h2>
        <p className="mt-3 text-sumi-muted">
          Miễn phí mãi mãi. Không quảng cáo. Không giới hạn bài học.
        </p>
        <Link
          href="/dang-ky"
          className="mt-7 inline-flex h-14 items-center rounded-2xl bg-sakura-500 px-8 text-lg font-semibold text-white shadow-sm transition hover:bg-sakura-600 active:scale-[0.98]"
        >
          Tạo tài khoản miễn phí
        </Link>
      </section>

      {/* ---------- Chân trang ---------- */}
      <footer className="mt-10 border-t border-[#E8E2D9] py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-sumi-muted">
          <p className="font-semibold text-sumi">🌸 Nihongo Kizuna</p>
          <p className="mt-2">
            Dự án <strong>phi lợi nhuận</strong>, phục vụ cộng đồng người học có hoàn cảnh khó khăn.
          </p>
          <p className="mt-1">Không thu phí · Không quảng cáo · Không bán dữ liệu người dùng.</p>
        </div>
      </footer>
    </main>
  );
}
