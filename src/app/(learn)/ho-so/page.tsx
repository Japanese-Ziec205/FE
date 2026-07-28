'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, Monitor, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/auth-store';
import { api, ApiException } from '@/lib/api-client';
import { changePasswordSchema, type ChangePasswordForm } from '@/lib/validators';
import { formatRelativeVi } from '@/lib/utils';
import type { SessionInfo } from '@/lib/types';
import { LearningGoalCard } from '@/components/learn/LearningGoalCard';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuthStore();

  // `null` nghĩa là "chưa sửa gì, lấy theo giá trị hiện tại của tài khoản".
  // Cách này tránh phải đồng bộ prop vào state bằng useEffect.
  const [draftName, setDraftName] = useState<string | null>(null);
  const displayName = draftName ?? user?.displayName ?? '';

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [pwMsg, setPwMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  // Tăng lên để yêu cầu tải lại danh sách phiên
  const [sessionsVersion, setSessionsVersion] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  // setState chỉ xảy ra trong callback bất đồng bộ, không gọi thẳng trong thân effect
  useEffect(() => {
    let cancelled = false;
    api
      .get<SessionInfo[]>('/auth/sessions')
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionsVersion]);

  const reloadSessions = () => setSessionsVersion((v) => v + 1);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.patch('/users/me', { displayName });
      await refreshUser();
      setDraftName(null); // quay về bám theo giá trị của tài khoản
      setProfileMsg({ tone: 'success', text: 'Đã lưu thông tin.' });
    } catch (err) {
      setProfileMsg({
        tone: 'error',
        text: err instanceof ApiException ? err.message : 'Không lưu được. Vui lòng thử lại.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (values: ChangePasswordForm) => {
    setPwMsg(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      reloadSessions();
      setPwMsg({
        tone: 'success',
        text: 'Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất.',
      });
    } catch (err) {
      setPwMsg({
        tone: 'error',
        text: err instanceof ApiException ? err.message : 'Không đổi được mật khẩu.',
      });
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      reloadSessions();
    } catch {
      // Không cần báo lỗi: danh sách sẽ tự đúng sau lần tải lại
    }
  };

  const logoutEverywhere = async () => {
    if (!confirm('Đăng xuất khỏi tất cả thiết bị, kể cả thiết bị này?')) return;
    await api.post('/auth/logout-all').catch(() => undefined);
    await logout();
    window.location.href = '/dang-nhap';
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-sumi">Hồ sơ của bạn</h1>

      {/* ---------- Thông tin cơ bản ---------- */}
      <Card>
        <CardHeader title="Thông tin cơ bản" />

        {profileMsg && (
          <Alert tone={profileMsg.tone} className="mb-4">
            {profileMsg.text}
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            label="Tên hiển thị"
            value={displayName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={50}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-sumi">Định danh đăng nhập</p>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-[#E8E2D9] bg-[#FAF7F2] px-4 py-3">
              <span className="text-sumi">{user?.primaryIdentifier?.masked ?? '—'}</span>
              {user?.isVerified ? (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-matcha-50 px-2.5 py-1 text-xs font-medium text-matcha-800">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Đã xác thực
                </span>
              ) : (
                <span className="ml-auto rounded-full bg-yamabuki-50 px-2.5 py-1 text-xs font-medium text-yamabuki-800">
                  Chưa xác thực
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={saveProfile}
            isLoading={savingProfile}
            disabled={!displayName.trim() || displayName === user?.displayName}
          >
            Lưu thay đổi
          </Button>
        </div>
      </Card>

      {/* ---------- Mục tiêu học tập ---------- */}
      <LearningGoalCard />

      {/* ---------- Đổi mật khẩu ---------- */}
      <Card>
        <CardHeader
          title="Đổi mật khẩu"
          subtitle="Sau khi đổi, các thiết bị khác sẽ bị đăng xuất."
        />

        {pwMsg && (
          <Alert tone={pwMsg.tone} className="mb-4">
            {pwMsg.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit(changePassword)} className="space-y-4" noValidate>
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            leftIcon={<LockKeyhole className="h-5 w-5" />}
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            leftIcon={<LockKeyhole className="h-5 w-5" />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            autoComplete="new-password"
            leftIcon={<LockKeyhole className="h-5 w-5" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Đổi mật khẩu
          </Button>
        </form>
      </Card>

      {/* ---------- Thiết bị đăng nhập ---------- */}
      <Card>
        <CardHeader
          title="Thiết bị đang đăng nhập"
          subtitle="Nếu thấy thiết bị lạ, hãy đăng xuất nó ngay."
        />

        {loadingSessions ? (
          <p className="text-sumi-muted">Đang tải...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sumi-muted">Không có phiên nào.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-[#E8E2D9] p-4"
              >
                <Monitor className="h-5 w-5 shrink-0 text-sumi-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sumi">
                    {s.label}
                    {s.isCurrent && (
                      <span className="ml-2 rounded-full bg-matcha-50 px-2 py-0.5 text-xs font-medium text-matcha-800">
                        Thiết bị này
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-sumi-muted">
                    Hoạt động {formatRelativeVi(s.lastUsedAt)}
                  </p>
                </div>
                {!s.isCurrent && (
                  <Button variant="ghost" size="sm" onClick={() => revokeSession(s.id)}>
                    Đăng xuất
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <Button variant="outline" className="mt-4" onClick={logoutEverywhere}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Đăng xuất khỏi tất cả thiết bị
        </Button>
      </Card>
    </div>
  );
}
