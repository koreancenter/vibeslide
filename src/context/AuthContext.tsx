import React, { createContext, useCallback, useContext, useState } from "react";
import { LocalAccountUser } from "../types";

export type AuthModalMode = "login" | "register" | "account";

interface RegisterInput {
  username: string;
  email: string;
  displayName?: string;
  password: string;
  preferredThemeId?: string;
}

interface LoginInput {
  identifier: string;
  password: string;
}

interface UpdateProfileInput {
  displayName?: string;
  preferredThemeId?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthContextType {
  user: LocalAccountUser | null;
  isAuthenticated: boolean;
  authModalMode: AuthModalMode;
  setAuthModalMode: (mode: AuthModalMode) => void;
  isSubmitting: boolean;
  authError: string | null;
  clearAuthError: () => void;
  register: (input: RegisterInput) => Promise<LocalAccountUser | null>;
  login: (input: LoginInput) => Promise<LocalAccountUser | null>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<LocalAccountUser | null>;
  deleteAccount: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalAccountUser | null>(null);
  // Session bearer token kept strictly in JS/React memory (never persisted to Web Storage)
  const [token, setToken] = useState<string | null>(null);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<LocalAccountUser | null> => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user || !data?.token) {
        setAuthError(data?.error || "로컬 계정 생성에 실패했습니다.");
        return null;
      }
      setToken(data.token);
      setUser(data.user);
      setAuthModalMode("account");
      return data.user as LocalAccountUser;
    } catch {
      setAuthError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<LocalAccountUser | null> => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user || !data?.token) {
        setAuthError(data?.error || "로그인에 실패했습니다.");
        return null;
      }
      setToken(data.token);
      setUser(data.user);
      setAuthModalMode("account");
      return data.user as LocalAccountUser;
    } catch {
      setAuthError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const activeToken = token;
    setToken(null);
    setUser(null);
    setAuthError(null);
    setAuthModalMode("login");
    if (activeToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch {
        // Session already cleared in memory
      }
    }
  }, [token]);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<LocalAccountUser | null> => {
      if (!token) {
        setAuthError("로그인이 필요합니다.");
        return null;
      }
      setIsSubmitting(true);
      setAuthError(null);
      try {
        const res = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.user) {
          if (res.status === 401) {
            setToken(null);
            setUser(null);
          }
          setAuthError(data?.error || "계정 정보 수정에 실패했습니다.");
          return null;
        }
        setUser(data.user);
        return data.user as LocalAccountUser;
      } catch {
        setAuthError("서버와 통신할 수 없습니다.");
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [token]
  );

  const deleteAccount = useCallback(
    async (password: string): Promise<boolean> => {
      if (!token) {
        setAuthError("로그인이 필요합니다.");
        return false;
      }
      setIsSubmitting(true);
      setAuthError(null);
      try {
        const res = await fetch("/api/auth/me", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAuthError(data?.error || "계정 삭제에 실패했습니다.");
          return false;
        }
        setToken(null);
        setUser(null);
        setAuthModalMode("login");
        return true;
      } catch {
        setAuthError("서버와 통신할 수 없습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && token),
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
};
