export type Role = 'student' | 'contributor' | 'lecturer' | 'admin';

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted';

export interface PublicUser {
  id: string;
  displayName: string;
  role: Role;
  avatarPreset: number;
  avatarKey: string | null;
  status: UserStatus;
  isVerified: boolean;
  primaryIdentifier: { type: 'email' | 'phone'; masked: string } | null;
  currentLevelCode: string;
  settings: UserSettings;
}

export interface UserSettings {
  uiMode: 'auto' | 'genki' | 'shizuka';
  theme: 'light' | 'dark' | 'system';
  dataSaver: boolean;
  furiganaMode: 'always' | 'above_level' | 'never';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  reminderEnabled: boolean;
  reminderTime: string;
  emailNotifications: boolean;
  romajiCrutch: boolean;
  hideFromLeaderboard: boolean;
}

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
  onboardingCompleted?: boolean;
}

export interface RegisterResult {
  userId: string;
  identifierType: 'email' | 'phone';
  requiresVerification: boolean;
  otpSent: boolean;
  otpSentTo: string | null;
  message: string;
}

export interface OtpSendResult {
  sentTo: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyOtpResult extends Partial<AuthResult> {
  verified: boolean;
  nextStep: 'authenticated' | 'reset_password';
}

export interface UserStats {
  totals: {
    studyHours: number;
    studyMinutes: number;
    lessonsCompleted: number;
    kanaLearned: number;
    kanjiLearned: number;
    vocabularyLearned: number;
    grammarLearned: number;
    reviewsDone: number;
    examsTaken: number;
  };
  streak: {
    current: number;
    longest: number;
    lastStudyDate: string | null;
    freezesAvailable: number;
    freezesUsedTotal: number;
  };
  xp: {
    total: number;
    thisWeek: number;
    level: number;
    levelTitle: string;
    intoLevel: number;
    neededForNextLevel: number;
    progressPercent: number;
  };
  currentLevelCode: string;
  dailyGoalMinutes: number;
}

export interface SessionInfo {
  id: string;
  label: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details: unknown;
}

export interface FieldIssue {
  field: string;
  message: string;
}
