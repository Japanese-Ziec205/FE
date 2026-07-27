# Khu vực học tập — ghi chú về bảo vệ route

## Vì sao không dùng `middleware.ts` để chặn route

Kiến trúc của dự án tách FE (Vercel) và BE (Render) thành **hai domain khác nhau**.
Cookie refresh token `rt` do backend đặt, nên nó thuộc về `*.onrender.com` —
Next.js middleware chạy trên `*.vercel.app` **không bao giờ đọc được cookie đó**.

Nếu viết middleware kiểu:

```ts
const hasSession = req.cookies.has('rt');   // ❌ luôn false ở production
```

thì mọi người dùng đã đăng nhập đều bị đá về trang đăng nhập.

## Cách đang làm

Bảo vệ ở phía client, trong [`layout.tsx`](layout.tsx):

1. `AuthProvider` gọi `bootstrap()` một lần khi app khởi động → gọi `POST /auth/refresh`
   (kèm `credentials: 'include'` để trình duyệt gửi cookie sang đúng domain backend).
2. Trong lúc chờ, layout hiển thị màn hình tải — không nháy nội dung.
3. Xong mà chưa đăng nhập thì `router.replace('/dang-nhap')`.

Đây **chỉ là lớp trải nghiệm**. Mọi kiểm tra quyền thật nằm ở backend: ẩn nút bấm
không ngăn được ai gọi thẳng API.

## Nếu sau này muốn chặn ngay từ edge

Có hai cách, đều cần thay đổi kiến trúc:

- Đặt FE và BE dưới cùng một domain gốc (`app.tenmien.com` và `api.tenmien.com`),
  rồi set cookie với `Domain=.tenmien.com`. Khi đó middleware đọc được cookie.
- Hoặc thêm một Route Handler của Next.js làm proxy phiên, tự đặt cookie phiên
  trên domain của FE.

Cả hai đều là việc của giai đoạn sau, khi dự án đã có tên miền riêng.
