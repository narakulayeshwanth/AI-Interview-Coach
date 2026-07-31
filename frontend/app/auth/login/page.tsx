'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { token: string; user: any } }>('/api/auth/login', form);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass animate-fade-in-up" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="navbar-logo" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          <span className="gradient-text">AI Interview</span> Coach
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Welcome back</h2>
        <p className="text-sm text-secondary">Continue your interview prep journey</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input id="login-email" className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input id="login-password" className="input" type="password" placeholder="Your password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        </div>

        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}

        <button id="login-submit" type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Signing In...' : 'Sign In →'}
        </button>
      </form>

      <div className="divider" />
      <p className="text-sm text-center text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign Up Free</Link>
      </p>
    </div>
  );
}
