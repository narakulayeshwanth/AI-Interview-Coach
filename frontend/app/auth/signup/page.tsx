'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Machine Learning Engineer', 'DevOps Engineer', 'Product Manager', 'UI/UX Designer', 'QA Engineer', 'Other'];

export default function SignupPage() {
  const [form, setForm]   = useState({ name: '', email: '', password: '', targetRole: 'Full Stack Developer', experienceLevel: 'fresher' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { token: string; user: any } }>('/api/auth/register', form);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass animate-fade-in-up" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="navbar-logo" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          <span className="gradient-text">AI Interview</span> Coach
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Create your account</h2>
        <p className="text-sm text-secondary">Start your interview prep journey today</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input id="signup-name" className="input" type="text" placeholder="Your Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input id="signup-email" className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input id="signup-password" className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
        </div>

        <div className="form-group">
          <label className="form-label">Target Role</label>
          <select id="signup-role" className="select input" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Experience Level</label>
          <select id="signup-exp" className="select input" value={form.experienceLevel} onChange={e => setForm(f => ({ ...f, experienceLevel: e.target.value }))}>
            <option value="fresher">Fresher (0 yrs)</option>
            <option value="junior">Junior (1–2 yrs)</option>
            <option value="mid">Mid-Level (3–5 yrs)</option>
            <option value="senior">Senior (5+ yrs)</option>
          </select>
        </div>

        {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}

        <button id="signup-submit" type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Creating Account...' : 'Create Account →'}
        </button>
      </form>

      <div className="divider" />
      <p className="text-sm text-center text-secondary">
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign In</Link>
      </p>
    </div>
  );
}
