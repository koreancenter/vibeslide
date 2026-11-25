import React, { useEffect, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Palette,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useModalContext } from "../context/ModalContext";
import { useSlideContext } from "../context/SlideContext";
import { PRESENTATION_THEMES } from "../data/themes";

export const AuthModal: React.FC = () => {
  const modalCtx = useModalContext();
  const {
    user,
    isAuthenticated,
    authModalMode,
    setAuthModalMode,
    isSubmitting,
    authError,
    clearAuthError,
    register,
    login,
    logout,
    updateProfile,
    deleteAccount,
  } = useAuthContext();
  const { currentTheme, setCurrentTheme, triggerToast, language } = useSlideContext();

  const isOpen = modalCtx.isModalOpen("auth");
  const isKo = language === "ko";

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // My Account form state
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPreferredThemeId, setEditPreferredThemeId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    clearAuthError();
    setLocalValidationError(null);
    if (user) {
      setEditDisplayName(user.displayName);
      setEditPreferredThemeId(user.preferredThemeId || currentTheme.id);
    }
  }, [isOpen, user, currentTheme.id, clearAuthError]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        modalCtx.closeModal("auth");
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, modalCtx]);

  if (!isOpen) return null;

  const activeMode = isAuthenticated ? "account" : authModalMode === "register" ? "register" : "login";
  const displayError = localValidationError || authError;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationError(null);
    clearAuthError();

    if (regPassword.length < 8) {
      setLocalValidationError("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setLocalValidationError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    const created = await register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      displayName: regDisplayName.trim() || undefined,
      password: regPassword,
      preferredThemeId: currentTheme.id,
    });

    if (created) {
      setRegPassword("");
      setRegPasswordConfirm("");
      triggerToast(`로컬 계정 "${created.displayName}" 생성 및 로그인 완료`);
      modalCtx.closeModal("auth");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationError(null);
    clearAuthError();

    const loggedIn = await login({
      identifier: loginIdentifier.trim(),
      password: loginPassword,
    });

    if (loggedIn) {
      setLoginPassword("");
      if (loggedIn.preferredThemeId) {
        const matchedTheme = PRESENTATION_THEMES.find((t) => t.id === loggedIn.preferredThemeId);
        if (matchedTheme) {
          setCurrentTheme(matchedTheme);
        }
      }
      triggerToast(`${loggedIn.displayName}님으로 로그인되었습니다.`);
      modalCtx.closeModal("auth");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationError(null);
    clearAuthError();

    if (newPassword && newPassword.length < 8) {
      setLocalValidationError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    const updated = await updateProfile({
      displayName: editDisplayName.trim(),
      preferredThemeId: editPreferredThemeId || null,
      ...(newPassword ? { currentPassword, newPassword } : {}),
    });

    if (updated) {
      if (updated.preferredThemeId) {
        const matched = PRESENTATION_THEMES.find((t) => t.id === updated.preferredThemeId);
        if (matched) setCurrentTheme(matched);
      }
      setCurrentPassword("");
      setNewPassword("");
      triggerToast("내 계정 정보가 저장되었습니다.");
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    triggerToast("로그아웃되었습니다.");
    modalCtx.closeModal("auth");
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationError(null);
    if (!deletePassword) {
      setLocalValidationError("계정 삭제를 확인하려면 현재 비밀번호를 입력해 주세요.");
      return;
    }
    const ok = await deleteAccount(deletePassword);
    if (ok) {
      setDeletePassword("");
      setShowDeleteConfirm(false);
      triggerToast("로컬 계정이 삭제되었습니다.");
      modalCtx.closeModal("auth");
    }
  };

  const modalTitle =
    activeMode === "account"
      ? isKo
        ? "내 계정 관리"
        : "My Account"
      : activeMode === "register"
      ? isKo
        ? "로컬 계정 만들기"
        : "Create Local Account"
      : isKo
      ? "로그인"
      : "Sign In";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => modalCtx.closeModal("auth")}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        className="bg-[#10141e] border border-white/[0.12] rounded-2xl w-full max-w-lg max-h-[88vh] shadow-2xl overflow-hidden flex flex-col text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#141925] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeMode === "account" ? (
              <User className="w-4 h-4 text-blue-400 shrink-0" />
            ) : activeMode === "register" ? (
              <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <LogIn className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <h2 className="text-base font-semibold text-white tracking-tight truncate">
              {modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => modalCtx.closeModal("auth")}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close Account Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest Mode Switcher Tabs */}
        {!isAuthenticated && (
          <div className="px-6 pt-4 shrink-0">
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0a0d14] border border-white/[0.08] rounded-xl">
              <button
                type="button"
                id="auth-tab-login"
                onClick={() => {
                  clearAuthError();
                  setLocalValidationError(null);
                  setAuthModalMode("login");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  activeMode === "login"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>로그인</span>
              </button>
              <button
                type="button"
                id="auth-tab-register"
                onClick={() => {
                  clearAuthError();
                  setLocalValidationError(null);
                  setAuthModalMode("register");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  activeMode === "register"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>로컬 계정 만들기</span>
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {displayError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs leading-relaxed"
            >
              {displayError}
            </div>
          )}

          {/* MODE 1: REGISTER */}
          {activeMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                로컬 워크스페이스 전용 계정을 생성합니다. 비밀번호는 서버에서 암호화 해시(scrypt) 처리되어 안전하게 저장됩니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="reg-username" className="block text-xs font-medium text-slate-300">
                    아이디 (사용자명)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-username"
                      type="text"
                      required
                      minLength={2}
                      maxLength={32}
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="예: kim_seoul"
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-display-name" className="block text-xs font-medium text-slate-300">
                    표시 이름 (선택)
                  </label>
                  <input
                    id="reg-display-name"
                    type="text"
                    maxLength={48}
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="예: 김민준"
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300">
                    비밀번호 (8자 이상)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-password"
                      type={showRegPw ? "text" : "password"}
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="8자 이상 입력"
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPw((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      aria-label="비밀번호 표시 전환"
                    >
                      {showRegPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-password-confirm" className="block text-xs font-medium text-slate-300">
                    비밀번호 확인
                  </label>
                  <input
                    id="reg-password-confirm"
                    type={showRegPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => modalCtx.closeModal("auth")}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap"
                >
                  취소
                </button>
                <button
                  type="submit"
                  id="btn-submit-register"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "생성 중..." : "로컬 계정 만들기"}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: LOGIN */}
          {activeMode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                생성한 로컬 아이디 또는 이메일로 로그인하면 개인 기본 테마와 프로필 설정을 바로 불러옵니다.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="login-identifier" className="block text-xs font-medium text-slate-300">
                  아이디 또는 이메일
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="아이디 또는 이메일 입력"
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
                  비밀번호
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showLoginPw ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="비밀번호 표시 전환"
                  >
                    {showLoginPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setAuthModalMode("register")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer whitespace-nowrap"
                >
                  계정이 없으신가요? 로컬 계정 만들기
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => modalCtx.closeModal("auth")}
                    className="px-3.5 py-2 rounded-lg hover:bg-white/10 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-login"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "로그인 중..." : "로그인"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE 3: MY ACCOUNT */}
          {activeMode === "account" && user && (
            <div className="space-y-5">
              {/* Account Summary Header (unboxed clean divider layout) */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/35 flex items-center justify-center text-sm font-bold text-blue-300 shrink-0">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="font-mono">@{user.username}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-account-logout"
                  onClick={handleLogoutClick}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-rose-500/20 border border-white/[0.1] hover:border-rose-500/40 text-xs font-medium text-slate-200 hover:text-rose-200 flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>

              {/* Metadata row (tabular numerals, unboxed) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 tabular-nums">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>로컬 인증 활성</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>

              {/* Profile & Theme Preferences Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="acc-display-name" className="block text-xs font-medium text-slate-300">
                    표시 이름
                  </label>
                  <input
                    id="acc-display-name"
                    type="text"
                    required
                    maxLength={48}
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="acc-preferred-theme" className="block text-xs font-medium text-slate-300">
                      기본 테마 설정 (로그인 시 자동 적용)
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditPreferredThemeId(currentTheme.id)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                    >
                      <Palette className="w-3 h-3" />
                      <span>현재 테마 가져오기</span>
                    </button>
                  </div>
                  <select
                    id="acc-preferred-theme"
                    value={editPreferredThemeId}
                    onChange={(e) => setEditPreferredThemeId(e.target.value)}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {PRESENTATION_THEMES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div className="text-xs font-medium text-slate-300">비밀번호 변경 (선택)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="현재 비밀번호"
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호 (8자 이상)"
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm((v) => !v)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>로컬 계정 삭제</span>
                  </button>

                  <button
                    type="submit"
                    id="btn-save-account"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "저장 중..." : "계정 설정 저장"}</span>
                  </button>
                </div>
              </form>

              {showDeleteConfirm && (
                <form
                  onSubmit={handleDeleteAccount}
                  className="pt-4 border-t border-rose-500/30 space-y-2.5"
                >
                  <div className="text-xs font-medium text-rose-300">
                    계정을 영구 삭제하려면 현재 비밀번호를 입력해 주세요.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      required
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="현재 비밀번호 확인"
                      className="flex-1 bg-[#090c14] border border-rose-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
                    >
                      삭제 확인
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
