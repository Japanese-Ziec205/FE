import { cn } from '@/lib/utils';

type Pose = 'wave' | 'cheer' | 'write';

/**
 * Kizuna — linh vật của hệ thống, vẽ bằng SVG nội tuyến.
 *
 * Cố tình không dùng file ảnh: SVG chỉ nặng vài KB, hiện ngay cả khi mạng chậm,
 * và co giãn sắc nét ở mọi kích thước. Người dùng mục tiêu của dự án
 * thường dùng máy yếu và mạng theo dung lượng.
 */
export function Mascot({
  pose = 'wave',
  className,
  animated = true,
}: {
  pose?: Pose;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('h-24 w-24', animated && 'animate-float', className)}
      role="img"
      aria-label="Kizuna — linh vật của Nihongo Kizuna"
    >
      {/* Tai */}
      <path d="M32 38 L26 18 L46 28 Z" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M88 38 L94 18 L74 28 Z" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Đầu */}
      <circle cx="60" cy="54" r="30" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" />
      {/* Mõm */}
      <ellipse cx="60" cy="62" rx="19" ry="15" fill="#F9D888" />

      {/* Khăn học trò màu chàm */}
      <path d="M31 40 Q60 30 89 40 L89 46 Q60 36 31 46 Z" fill="#1B3A6B" />

      {/* Hạc giấy trên đầu */}
      <path d="M52 22 L60 12 L68 22 L60 26 Z" fill="#FFF9F2" stroke="#1B3A6B" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M60 12 L66 8 L68 16" fill="none" stroke="#1B3A6B" strokeWidth="1.6" strokeLinecap="round" />

      {/* Mắt — nhắm cong khi reo mừng, mở tròn khi khác */}
      {pose === 'cheer' ? (
        <>
          <path d="M46 52 Q51 46 56 52" fill="none" stroke="#1F2430" strokeWidth="3" strokeLinecap="round" />
          <path d="M64 52 Q69 46 74 52" fill="none" stroke="#1F2430" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="51" cy="50" r="4" fill="#1F2430" />
          <circle cx="69" cy="50" r="4" fill="#1F2430" />
          <circle cx="52.5" cy="48.5" r="1.4" fill="#fff" />
          <circle cx="70.5" cy="48.5" r="1.4" fill="#fff" />
        </>
      )}

      {/* Má hồng */}
      <ellipse cx="40" cy="60" rx="5" ry="3.5" fill="#F58FA3" opacity="0.75" />
      <ellipse cx="80" cy="60" rx="5" ry="3.5" fill="#F58FA3" opacity="0.75" />

      {/* Mũi và miệng */}
      <ellipse cx="60" cy="58" rx="3.5" ry="2.6" fill="#1F2430" />
      <path d="M60 61 Q55 67 51 63 M60 61 Q65 67 69 63" fill="none" stroke="#1F2430" strokeWidth="2" strokeLinecap="round" />

      {/* Thân */}
      <ellipse cx="60" cy="98" rx="24" ry="20" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" />
      <ellipse cx="60" cy="101" rx="15" ry="14" fill="#F9D888" />

      {/* Chi tuỳ theo tư thế */}
      {pose === 'wave' && (
        <ellipse cx="88" cy="84" rx="8" ry="10" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" transform="rotate(-28 88 84)" />
      )}
      {pose === 'cheer' && (
        <>
          <ellipse cx="30" cy="80" rx="8" ry="10" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" transform="rotate(32 30 80)" />
          <ellipse cx="90" cy="80" rx="8" ry="10" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" transform="rotate(-32 90 80)" />
        </>
      )}
      {pose === 'write' && (
        <>
          <ellipse cx="86" cy="92" rx="8" ry="10" fill="#F2637E" stroke="#8F3042" strokeWidth="2.5" transform="rotate(-18 86 92)" />
          {/* Bút lông */}
          <rect x="90" y="66" width="4.5" height="26" rx="2" fill="#F5B942" stroke="#AD7C1D" strokeWidth="1.4" transform="rotate(18 92 79)" />
          <path d="M96 92 L92 104 L88 92 Z" fill="#1B3A6B" transform="rotate(18 92 96)" />
        </>
      )}
    </svg>
  );
}
