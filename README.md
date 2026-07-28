# Nihongo Kizuna — Frontend

Giao diện nền tảng học tiếng Nhật trực tuyến **phi lợi nhuận**, miễn phí hoàn toàn, hướng tới người học có hoàn cảnh khó khăn.

> Backend: https://github.com/Japanese-Ziec205/BE

---

## Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Giao diện | TailwindCSS 3 |
| Trạng thái | Zustand |
| Biểu mẫu | React Hook Form + zod |
| Icon | lucide-react |
| Triển khai | Vercel |

## Chạy tại máy

```bash
git clone https://github.com/Japanese-Ziec205/FE.git
cd FE
npm install

cp .env.example .env.local     # trỏ NEXT_PUBLIC_API_URL tới backend của bạn
npm run dev                     # http://localhost:3000
```

Cần chạy backend song song (mặc định `http://localhost:5000`).

## Các lệnh

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy chế độ phát triển |
| `npm run build` | Build bản production |
| `npm start` | Chạy bản đã build |
| `npm run lint` | Kiểm tra ESLint |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |

## Cấu trúc thư mục

```
src/
├── app/
│   ├── page.tsx            trang giới thiệu (public, tĩnh, tốt cho SEO)
│   ├── layout.tsx          layout gốc, nạp font và AuthProvider
│   ├── globals.css         design token + lớp tiện ích dùng chung
│   ├── (auth)/             đăng ký · đăng nhập · xác thực OTP · quên/đặt lại mật khẩu
│   └── (learn)/            khu vực cần đăng nhập
│       ├── bang-dieu-khien/  trang chính
│       ├── hoc/              bảng chữ cái · Kanji · từ vựng · ngữ pháp
│       ├── on-tap/           vòng ôn tập SRS
│       ├── luyen-viet/       bảng viết tay
│       ├── thi-thu/          thi thử JLPT: chọn đề · phòng thi · kết quả
│       ├── thanh-tich/       cấp độ · XP · huy hiệu
│       ├── ho-so/            tài khoản · mục tiêu học tập · phiên đăng nhập
│       └── quan-tri/         CMS — chỉ ban biên soạn thấy
├── components/
│   ├── ui/                 Button · Input · Alert · Card · Mascot · States
│   ├── scene/              ảnh nền trang giới thiệu
│   └── providers/          AuthProvider
├── hooks/
│   ├── useApi.ts           tải dữ liệu API + gọi hành động (thay cho React Query)
│   └── useStudyTracker.ts  nhịp báo ghi nhận giờ học
└── lib/
    ├── api-client.ts       fetch wrapper + tự động refresh token
    ├── auth-store.ts       trạng thái đăng nhập (Zustand)
    ├── validators.ts       schema zod, khớp với backend
    ├── types.ts            kiểu dữ liệu API xác thực
    ├── learn-types.ts      kiểu dữ liệu API học tập
    └── utils.ts            hàm tiện ích
```

## Ghi chú thiết kế

**Access token không nằm trong `localStorage`.** Nó chỉ được giữ trong bộ nhớ JavaScript. `localStorage` đọc được bằng script, nên một lỗ hổng XSS là đủ để đánh cắp phiên. Đổi lại, tải lại trang sẽ mất token — vì vậy `AuthProvider` gọi `POST /auth/refresh` một lần khi khởi động để lấy lại token từ cookie `httpOnly` mà backend đã đặt.

**Tự động refresh khi token hết hạn.** `api-client.ts` bắt lỗi `401 AUTH_TOKEN_EXPIRED`, gọi refresh rồi thử lại request cũ. Nhiều request cùng hết hạn một lúc sẽ dùng chung **một** lần refresh, không gọi trùng lặp.

**Không có `middleware.ts` chặn route.** FE ở `*.vercel.app` còn BE ở `*.onrender.com` — hai domain khác nhau, nên cookie phiên thuộc về backend và middleware của Next **không đọc được**. Viết `req.cookies.has('rt')` sẽ luôn trả về `false` và đá văng cả người đã đăng nhập. Việc bảo vệ route làm ở phía client trong `(learn)/layout.tsx`; chi tiết xem [`src/app/(learn)/README.md`](src/app/(learn)/README.md).

Dù sao thì bảo vệ ở frontend cũng chỉ là lớp trải nghiệm — **mọi kiểm tra quyền thật đều nằm ở backend**.

**Chỉ đăng ký bằng email, và bắt buộc xác thực.** Ban đầu hệ thống nhận cả số điện thoại, nhưng gửi SMS xác thực tại Việt Nam đều mất phí và cần đăng ký brandname — không khả thi với một dự án phi lợi nhuận. Số điện thoại không xác thực được thì chỉ là một ô nhập ai cũng bịa được, tức là mở đường cho tài khoản rác. Đăng ký xong **chưa** có phiên đăng nhập: phải nhập đúng mã 6 số gửi về email mới vào được. Đăng nhập bằng tài khoản chưa xác thực sẽ nhận mã lỗi `AUTH_EMAIL_NOT_VERIFIED` và được đưa thẳng sang màn nhập mã.

**Nền trang giới thiệu là ảnh tĩnh, không phải cảnh 3D.** Bản đầu dựng bằng Three.js, nhưng ba thư viện cộng lại khoảng 900KB phải tải xong mới thấy được gì, lại chạy WebGL liên tục gây hao pin và giật trên máy yếu. Với nhóm đối tượng dùng điện thoại cũ và mạng tính theo dung lượng, đó là cái giá quá đắt cho phần trang trí. Ảnh tĩnh cũng cho bố cục ổn định trên mọi thiết bị nên không cần các lớp thoái lui nữa.

**Nhịp báo giờ học phải có dao động.** Backend đánh dấu là đáng ngờ khi 6 nhịp gần nhất lệch nhau dưới 0,5 giây — vì script tự động gửi đúng 60,0 giây một lần còn người thật thì không. Một `setInterval(60_000)` chạy trên máy nối mạng tốt lại tạo ra đúng kiểu nhịp đều đó, và giờ học sẽ bị lặng lẽ loại bỏ mà không báo lỗi gì. Vì vậy `useStudyTracker` gửi mỗi 55–75 giây ngẫu nhiên. Client cũng KHÔNG bao giờ gửi lên "tôi đã học bao nhiêu phút" — nó chỉ báo "tôi vẫn ở đây", thời lượng do server tự tính.

**Đồng hồ thi lấy theo máy chủ.** Phòng thi nhận `serverTime` và `sectionDeadline` từ API, đo độ lệch với đồng hồ máy người dùng một lần rồi trừ đi ở mọi phép tính sau đó. Đếm bằng đồng hồ máy thì chỉnh giờ hệ thống là tự cho mình thêm thời gian.

**Giao diện ưu tiên điện thoại đời thấp.** Chữ không bao giờ nhỏ hơn 16px, vùng chạm tối thiểu 44×44px, tôn trọng `prefers-reduced-motion`, mọi chức năng dùng được bằng bàn phím, và không dùng màu làm tín hiệu duy nhất (đúng/sai luôn kèm icon và chữ).

**Linh vật vẽ bằng SVG nội tuyến.** Chỉ vài KB, hiện ngay cả khi mạng chậm, sắc nét ở mọi kích thước — thay vì tải file ảnh.

## Bảng màu

| Vai trò | Tên | Mã màu |
|---|---|---|
| Chính | Sakura | `#F2637E` |
| Sâu | Ai (chàm) | `#1B3A6B` |
| Thành công | Matcha | `#6BBF59` |
| XP / Chuỗi ngày | Yamabuki | `#F5B942` |
| Nền | Washi | `#FFF9F2` |
| Chữ | Sumi | `#1F2430` |

Chú ý khi dùng: chữ trắng trên nền Matcha chỉ đạt tương phản 2.6:1 (**không đạt** WCAG AA) — hãy dùng chữ màu `matcha-800`. Chữ trắng trên nền Sakura đạt 3.4:1 nên chỉ dùng cho chữ từ 16px trở lên và in đậm.

## Triển khai lên Vercel

1. Import repo này vào Vercel (framework tự nhận là Next.js).
2. Thêm biến môi trường:
   - `NEXT_PUBLIC_API_URL` → `https://<ten-app>.onrender.com/api/v1`
   - `NEXT_PUBLIC_SITE_URL` → domain Vercel của bạn
3. Deploy.
4. Quay lại backend, thêm domain Vercel vào biến `CORS_ORIGINS`.

> Gói Hobby của Vercel không cho dùng vào mục đích thương mại. Dự án này phi lợi nhuận nên hợp lệ.

## Trạng thái

| Phần | Tình trạng |
|---|---|
| Trang giới thiệu | ✅ Xong |
| Đăng ký / Đăng nhập | ✅ Xong |
| Xác thực OTP | ✅ Xong |
| Quên / Đặt lại mật khẩu | ✅ Xong |
| Bảng điều khiển | ✅ Xong (dữ liệu thật từ API) |
| Hồ sơ · Đổi mật khẩu · Quản lý thiết bị | ✅ Xong |
| Bảng chữ cái, Kanji, từ vựng | 🚧 Giai đoạn 3 |
| Ôn tập SRS | 🚧 Giai đoạn 3 |
| Luyện viết tay | 🚧 Giai đoạn 3 |
| Thi thử JLPT | 🚧 Giai đoạn 5 |
| Trang quản trị | 🚧 Giai đoạn 2 |

## Giấy phép

Dự án phi lợi nhuận, phát hành theo giấy phép MIT. Mọi đóng góp đều được hoan nghênh. 🌸
