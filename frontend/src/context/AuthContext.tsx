import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearAuthToken, getAuthToken, getRefreshToken, isAuthenticated, setAuthToken, setRefreshToken } from '../utils/auth';
import type { User, UserRole } from '../models/user/user';
import { getUserById } from '../api/user.api';
import type { TokenPair } from '../models/auth/tokens';
import { logout as logoutApi } from '../api/auth.api';

type AuthContextValue = {
  isAuthenticated: boolean;
  userId: string | null;
  role: UserRole | null;
  user: User | null;
  userLoading: boolean;
  refreshUser: () => Promise<void>;
  setTokens: (tokens: TokenPair) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwtPayload(token: string): { sub?: string; role?: UserRole } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Pad base64 string (atob requires length multiple of 4)
    while (payloadB64.length % 4 !== 0) payloadB64 += '=';
    const json = atob(payloadB64);
    return JSON.parse(json) as { sub?: string; role?: UserRole };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAuthToken());

  // Keep state in sync if another tab logs in/out.
  useEffect(() => {
    const onStorage = () => {
      setAccessTokenState(getAuthToken());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const decoded = accessToken ? decodeJwtPayload(accessToken) : null;
  const userId = decoded?.sub || null;
  const role = decoded?.role || null;

  const setTokens = useCallback((tokens: TokenPair) => {
    setAuthToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setAccessTokenState(tokens.accessToken);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated() || !userId) {
      setUser(null);
      return;
    }

    // Backend allows fetching user only for SUPER_ADMIN / OPERATIONS
    if (role !== 'SUPER_ADMIN' && role !== 'OPERATIONS') {
      setUser(null);
      return;
    }

    setUserLoading(true);
    try {
      const me = await getUserById(userId);
      console.log("Fetched user in refreshUser:", me);
      setUser(me);
    } catch {
      // If we can't load user, keep UI stable but force logout if token is invalid.
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    void refreshUser();
  }, [accessToken, userId, role]);

  const logout = useCallback(() => {
    void (async () => {
      try {
        await logoutApi(getRefreshToken());
      } catch {
        // ignore logout failures; we'll clear local session anyway
      } finally {
        clearAuthToken();
        setUser(null);
        setAccessTokenState(null);
        window.location.href = '/login';
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: isAuthenticated(),
      userId,
      role,
      user,
      userLoading,
      refreshUser,
      setTokens,
      logout,
    }),
    [userId, role, user, userLoading, refreshUser, setTokens, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}