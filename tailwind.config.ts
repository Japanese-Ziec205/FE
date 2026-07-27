import type { Config } from 'tailwindcss';

/**
 * Bảng màu lấy từ tài liệu thiết kế 10 — Design System.
 * Sakura (chính) · Ai chàm (sâu) · Matcha (thành công) · Yamabuki (XP) · Washi (nền kem)
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: '#FDEEF1',
          100: '#FBD9E0',
          200: '#F7B4C2',
          300: '#F58FA3',
          400: '#F2637E',
          500: '#F2637E',
          600: '#DB4E69',
          700: '#B93E55',
          800: '#8F3042',
          900: '#66222F',
        },
        ai: {
          50: '#E8EDF6',
          100: '#C6D2E8',
          200: '#8FA5CC',
          300: '#5878B0',
          400: '#2F5391',
          500: '#1B3A6B',
          600: '#162F57',
          700: '#112443',
          800: '#0C1A30',
          900: '#070F1C',
        },
        matcha: {
          50: '#EFF8ED',
          100: '#D7EDD2',
          200: '#AFDBA5',
          300: '#8BCC7C',
          400: '#6BBF59',
          500: '#6BBF59',
          600: '#57A046',
          700: '#457F38',
          800: '#335E29',
          900: '#213D1B',
        },
        yamabuki: {
          50: '#FEF7E7',
          100: '#FCEBC2',
          200: '#F9D888',
          300: '#F7C765',
          400: '#F5B942',
          500: '#F5B942',
          600: '#D89C25',
          700: '#AD7C1D',
          800: '#825D16',
          900: '#573E0E',
        },
        beni: '#E04B4B',
        washi: '#FFF9F2',
        sumi: {
          DEFAULT: '#1F2430',
          muted: '#5A6072',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        jp: ['var(--font-jp)', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'sans-serif'],
      },
      borderRadius: {
        // Chế độ Genki dùng bo góc lớn cho cảm giác mềm mại, thân thiện
        genki: '1.25rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(31, 36, 48, 0.06)',
        'card-hover': '0 6px 24px rgba(31, 36, 48, 0.10)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '70%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pop-in': 'pop-in 0.3s ease-out both',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
