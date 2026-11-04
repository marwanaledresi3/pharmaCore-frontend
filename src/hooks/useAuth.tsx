import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  company_id: string;
  roles: string[];           // ["Owner", ...]
  permissions: string[];     // ["invoices.view", ...]
  branch_id?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  hasRole: (name: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // تحميل من localStorage عند الإقلاع
  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const u = localStorage.getItem(USER_KEY);
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = useCallback((u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const hasPermission = useCallback(
    (code: string) => !!user?.permissions?.includes(code),
    [user]
  );
  const hasRole = useCallback(
    (name: string) => !!user?.roles?.includes(name),
    [user]
  );

  const value = useMemo(
    () => ({ user, token, loading, login, logout, hasPermission, hasRole }),
    [user, token, loading, login, logout, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}