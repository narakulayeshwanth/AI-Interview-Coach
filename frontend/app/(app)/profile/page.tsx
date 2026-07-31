'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { IconUser, IconFlame, IconZap, IconTrophy, IconMail, IconEdit } from '@/lib/icons';

const LEVELS = ['Rookie', 'Learner', 'Intermediate', 'Advanced', 'Expert', 'Elite'];

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: user?.name || '', targetRole: user?.targetRole || '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<{ success: boolean; data: any }>('/api/auth/profile', form);
      if (user && token) login(token, { ...user, ...res.data });
      setMsg('Profile updated!'); setEditing(false);
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  const level     = LEVELS[Math.min((user?.level || 1) - 1, LEVELS.length - 1)];
  const nextXP    = (user?.level || 1) * 100;
  const xpPercent = Math.min(((user?.xp || 0) % 100), 100);

  const statItems = [
    { Icon: IconFlame,  color: 'var(--warning)', label: 'Practice Streak', value: `${user?.streak} days` },
    { Icon: IconZap,    color: 'var(--success)', label: 'Total XP',         value: `${user?.xp} XP` },
    { Icon: IconTrophy, color: 'var(--accent)',  label: 'Current Level',    value: level },
    { Icon: IconMail,   color: 'var(--primary-light)', label: 'Email',      value: user?.email || '' },
  ];

  return (
    <div className="page-inner animate-fade-in" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <span style={{ display: 'flex', color: 'var(--primary)' }}><IconUser size={24} color="var(--primary)" /></span>
        <h1 style={{ fontSize: '1.75rem' }}>Profile</h1>
      </div>

      {/* Avatar + Info */}
      <div className="glass" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: '2px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-light)', flexShrink: 0 }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          {!editing ? (
            <>
              <h2 style={{ marginBottom: '0.25rem' }}>{user?.name}</h2>
              <p className="text-secondary text-sm">{user?.email}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{user?.targetRole}</span>
                <span className="badge badge-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <IconFlame size={12} color="currentColor" /> {user?.streak} day streak
                </span>
                <span className="badge badge-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <IconZap size={12} color="currentColor" /> {user?.xp} XP
                </span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input id="profile-name" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <input id="profile-role" className="input" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} />
              </div>
            </div>
          )}
        </div>
        <div>
          {!editing
            ? <button id="edit-profile-btn" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} style={{ gap: '0.375rem' }}>
                <IconEdit size={14} /> Edit
              </button>
            : <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button id="save-profile-btn" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
          }
        </div>
      </div>
      {msg && <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem' }}>{msg}</p>}

      {/* Level & XP */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level {user?.level}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)' }}>{level}</div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <IconZap size={16} color="var(--accent)" />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>{user?.xp} XP</div>
              <div className="text-xs text-muted">Next level at {nextXP} XP</div>
            </div>
          </div>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${xpPercent}%` }} /></div>
        <div className="text-xs text-muted" style={{ marginTop: '0.375rem' }}>{xpPercent}% to Level {(user?.level || 1) + 1}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {statItems.map(s => (
          <div key={s.label} className="glass stat-card" style={{ padding: '1.25rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'flex', color: s.color }}><s.Icon size={16} color={s.color} /></span>
              <span className="stat-card-label">{s.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
