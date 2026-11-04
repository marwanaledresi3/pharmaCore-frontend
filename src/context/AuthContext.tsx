import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Company } from '../types';
import { authApi } from '../api/authApi';
import { companyApi } from '../api/companyApi';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pharmacore_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pharmacore_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentCompany = useCallback(async () => {
    try {
      const comp = await companyApi.getCurrent();
      setCompany(comp);
    } catch {
      // Non-fatal or company context not ready
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('pharmacore_token');
    if (!storedToken) {
      setUser(null);
      setCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('pharmacore_user', JSON.stringify(userData));
      await fetchCurrentCompany();
    } catch {
      // Invalid token or session expired
      setToken(null);
      setUser(null);
      setCompany(null);
      localStorage.removeItem('pharmacore_token');
      localStorage.removeItem('pharmacore_user');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentCompany]);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setCompany(null);
    };

    window.addEventListener('pharmacore:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('pharmacore:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('pharmacore_token', res.token);
      setToken(res.token);
      // Fetch full profile with roles and permissions
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('pharmacore_user', JSON.stringify(userData));
      await fetchCurrentCompany();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pharmacore_token');
    localStorage.removeItem('pharmacore_user');
    setToken(null);
    setUser(null);
    setCompany(null);
  };

  const isOwner = user?.roles?.includes('Owner') || false;

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (isOwner) return true;
    return user.permissions?.includes(permissionCode) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isOwner,
        login,
        logout,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
