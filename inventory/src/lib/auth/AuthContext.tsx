
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthUser, login as apiLogin, fetchMe } from '@/lib/api/auth';
import { appPath, pagePath } from '@/lib/utils/basePath';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (...codes: string[]) => boolean;
  hasPermission: (code: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// ─── Safe localStorage readers ──────────────────────────────────────
function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    if (raw === 'undefined' || raw === 'null') return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return raw;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [isReady, setIsReady] = useState(false);

  // Validate token on boot
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!token) {
        setIsReady(true);
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
          localStorage.setItem(USER_KEY, JSON.stringify(me));
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          // Force redirect to login if we're not already there
          if (!['/login', '/admin-login'].includes(pagePath())) {
            window.location.replace(appPath('/login'));
            return;
          }
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('acting_property');
  }, []);

  const hasRole = useCallback(
    (...codes: string[]) => {
      if (!user) return false;
      return user.roles.some((r) => codes.includes(r.code));
    },
    [user]
  );

  const hasPermission = useCallback(
    (code: string) => {
      if (!user) return false;
      return user.permissions.includes(code);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isReady,
      login,
      logout,
      hasRole,
      hasPermission,
    }),
    [user, token, isReady, login, logout, hasRole, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}