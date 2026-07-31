'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User { _id: string; name: string; email: string; targetRole: string; xp: number; level: number; streak: number; }
interface AuthCtx { user: User | null; token: string | null; login: (token: string, user: User) => void; logout: () => void; loading: boolean; }

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      // Refresh user from API — only wipe token on genuine 401, not network errors
      api.get<{ success: boolean; data: User }>('/api/auth/me')
        .then(r => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
        .catch((err: any) => {
          // Only clear token if the server explicitly rejected it (401)
          if (err?.message?.includes('Not authenticated') || err?.message?.includes('Invalid or expired token') || err?.message?.includes('User not found')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          // Network errors (backend down) — keep the token, use cached user
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (t: string, u: User) => {
    setToken(t); setUser(u);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return <AuthContext.Provider value={{ user, token, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
