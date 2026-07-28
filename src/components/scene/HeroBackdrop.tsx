import Image from 'next/image';

/**
 * Nền trang giới thiệu.
 *
 * Trước đây đây là một cảnh 3D dựng bằng Three.js. Đã bỏ vì ba lý do:
 *
 * 1. Ba thư viện three + @react-three/fiber + drei cộng lại khoảng 900KB phải
 *    tải về trước khi thấy được gì. Dự án nhắm tới người học dùng điện thoại cũ
 *    và mạng tính theo dung lượng — đó là cái giá quá đắt cho phần trang trí.
 * 2. Cảnh 3D chạy WebGL liên tục, hao pin và làm máy yếu giật.
 * 3. Ảnh tĩnh cho ra bố cục ổn định trên mọi thiết bị, không phụ thuộc vào việc
 *    trình duyệt có bật WebGL hay không, nên không cần ba lớp thoái lui nữa.
 *
 * Ảnh được vẽ với nửa trái gần như trống trời, dành riêng cho phần chữ.
 */
export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <Image
        src="/scene/hero-japan.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/*
        Lớp phủ chỉ làm rõ vùng đặt chữ, không được che mất cảnh.

        Trên máy tính: đục tới mốc 30%, 70% tới mốc 55% — đúng ranh giới cột chữ
        trong lưới hai cột — rồi trong dần để lộ cổng torii và núi ở nửa phải.
        Trên điện thoại chữ chiếm hết bề ngang nên dùng một lớp mờ đều.
      */}
      <div className="absolute inset-0 bg-washi/70 dark:bg-[#141821]/75 md:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-washi from-30% via-washi/70 via-55% to-transparent dark:from-[#141821] dark:via-[#141821]/70 md:block" />

      {/* Mép dưới hoà dần vào nền trang để nối liền với phần nội dung kế tiếp */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-washi dark:to-[#141821]" />
    </div>
  );
}
