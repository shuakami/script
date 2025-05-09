"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, checkAuth } from '../services/api';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // 自动登录检查
  useEffect(() => {
    const checkAuthentication = async () => {
      const storedToken = Cookies.get(TOKEN_KEY);
      if (storedToken) {
        try {
          const isValid = await checkAuth();
          if (isValid) {
            setToken(storedToken);
            setIsAuthenticated(true);
            // 如果在登录页且已登录，跳转到dashboard
            if (window.location.pathname === '/login') {
              router.replace('/admin/dashboard');
            }
          } else {
            Cookies.remove(TOKEN_KEY);
            setToken(null);
            setIsAuthenticated(false);
          }
        } catch {
          Cookies.remove(TOKEN_KEY);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
    };
    checkAuthentication();
  }, [router]);

  const login = async (username: string, password: string) => {
    const data = await loginUser(username, password);
    setToken(data.token);
    setIsAuthenticated(true);
    router.push('/admin/dashboard');
  };

  const logout = () => {
    Cookies.remove(TOKEN_KEY);
    setToken(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
