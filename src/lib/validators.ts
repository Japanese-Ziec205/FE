import { z } from 'zod';

/**
 * Các quy tắc này phải khớp với validator phía backend
 * (`BE/src/modules/auth/auth.validators.ts`). Kiểm tra ở client chỉ để
 * phản hồi nhanh cho người dùng — server vẫn luôn kiểm tra lại.
 */

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123',
  'qwertyuiop', 'matkhau123', '11111111', '00000000', 'abcd1234', 'abcdefgh',
  'iloveyou', 'admin123', 'welcome1', '87654321', 'sunshine', 'princess',
  '123123123', 'zaq12wsx', 'qwerty123', 'nihongo123', 'vietnam123',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidIdentifier(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

/**
 * Chỉ nhận email.
 *
 * Hệ thống đã bỏ đăng ký bằng số điện thoại: gửi SMS xác thực tại Việt Nam đều
 * mất phí và cần đăng ký brandname, không khả thi với dự án phi lợi nhuận. Số
 * điện thoại không xác thực được thì chỉ là một ô nhập ai cũng bịa được.
 */
export const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập địa chỉ email')
  .refine(isValidIdentifier, 'Địa chỉ email không hợp lệ');

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(128, 'Mật khẩu quá dài')
  .refine((pw) => !COMMON_PASSWORDS.has(pw.toLowerCase()), 'Mật khẩu này quá dễ đoán')
  .refine((pw) => !/^(.)\1+$/.test(pw), 'Mật khẩu không được lặp lại một ký tự');

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Tên hiển thị cần ít nhất 2 ký tự')
      .max(50, 'Tên hiển thị tối đa 50 ký tự'),
    identifier: identifierSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Bạn cần đồng ý với điều khoản sử dụng' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Mã xác thực gồm 6 chữ số'),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z
  .object({
    code: z.string().trim().regex(/^\d{6}$/, 'Mã xác thực gồm 6 chữ số'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type OtpForm = z.infer<typeof otpSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

/** Đánh giá độ mạnh mật khẩu để hiện thanh gợi ý. Không phải kiểm tra bảo mật. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^\w\s]/.test(pw)) score += 1;
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) score = 0;

  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Khá mạnh', 'Mạnh'];
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: labels[s] };
}
