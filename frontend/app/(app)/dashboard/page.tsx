'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { IconFileText, IconTarget, IconActivity, IconZap, IconMicrophone, IconResume, IconHistory, IconTrendingUp, IconArrowRight } from '@/lib/icons';

interface Stats {
  readinessPercent: number; resumeScore: number; resumeGrade: string;
  totalSessions: number; avgScore: number; streak: number;
  xp: number; level: number;
  weakAreas: string[]; strongAreas: string[];
  radarData: { skill: string; score: number }[];
}
interface ChartPoint { date: string; score: number; mode: string; }

function ScoreRing({ value, size = 120, label }: { value: number; size?: number; label: string }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  const color = value >= 70 ? 'var(--success)' : value >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="score-ring-container">
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="score-ring-value">
          <div style={{ fontSize: size > 100 ? '1.5rem' : '1.1rem', fontWeight: 800, color }}>{value}%</div>
        </div>
      </div>
      <div className="text-sm text-secondary text-center font-semibold">{label}</div>
    </div>
  );
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
      <div className="text-secondary" style={{ marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>Score: {payload[0].value}</div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; data: Stats }>('/api/dashboard/stats'),
      api.get<{ success: boolean; data: ChartPoint[] }>('/api/dashboard/chart'),
    ]).then(([s, c]) => {
      setStats(s.data);
      setChart(c.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-inner">
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />)}
      </div>
    </div>
  );

  const statCards = [
    { label: 'Resume Score',       value: `${stats?.resumeScore ?? 0}%`,   Icon: IconFileText,  color: 'var(--accent)',        sub: `Grade ${stats?.resumeGrade ?? 'N/A'}` },
    { label: 'Avg Interview Score', value: `${stats?.avgScore ?? 0}/100`,   Icon: IconTarget,    color: 'var(--primary-light)', sub: `${stats?.totalSessions ?? 0} sessions` },
    { label: 'Practice Streak',    value: `${stats?.streak ?? 0} days`,     Icon: IconActivity,  color: 'var(--warning)',       sub: 'Keep it up!' },
    { label: 'XP Earned',          value: `${stats?.xp ?? 0} XP`,           Icon: IconZap,       color: 'var(--success)',       sub: `Level ${stats?.level ?? 1}` },
  ];

  const quickActions = [
    { href: '/interview/setup',    Icon: IconMicrophone, label: 'Start Mock Interview', desc: 'Practice a new session', color: 'var(--primary-subtle)',     borderColor: 'rgba(249,115,22,0.15)' },
    { href: '/resume',             Icon: IconResume,     label: 'Analyze Resume',       desc: 'Get ATS score & tips',  color: 'var(--accent-subtle)',       borderColor: 'rgba(245,158,11,0.15)' },
    { href: '/interview/history',  Icon: IconHistory,    label: 'View History',         desc: 'Review past sessions',  color: 'rgba(34,197,94,0.08)',        borderColor: 'rgba(34,197,94,0.15)' },
  ];

  return (
    <div className="page-inner animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-secondary text-sm">Here&apos;s your interview readiness overview</p>
        </div>
        <Link href="/interview/setup" className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <IconMicrophone size={16} />
          New Interview
        </Link>
      </div>

      {/* Top row — Readiness + Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Readiness Ring */}
        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start' }}>Interview Readiness</div>
          <ScoreRing value={stats?.readinessPercent ?? 0} size={140} label="Readiness Score" />
          <div style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {stats?.weakAreas?.slice(0, 2).map(a => <span key={a} className="badge badge-danger">{a}</span>)}
            {stats?.strongAreas?.slice(0, 1).map(a => <span key={a} className="badge badge-success">{a}</span>)}
          </div>
        </div>

        {/* Stat cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {statCards.map(s => (
            <div key={s.label} className="glass stat-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: s.color, display: 'flex' }}><s.Icon size={16} color={s.color} /></span>
                <span className="stat-card-label">{s.label}</span>
              </div>
              <div className="stat-card-value" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
              <div className="text-xs text-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle row — Radar + Line Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Skill Radar */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Skill Radar</div>
          {stats?.radarData?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={stats.radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Complete an interview to see your radar
            </div>
          )}
        </div>

        {/* Performance Chart */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Score Trend</div>
          {chart.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chart}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5}
                  dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
              <IconTrendingUp size={40} color="var(--border)" />
              <p className="text-sm">Complete interviews to see your progress</p>
              <Link href="/interview/setup" className="btn btn-primary btn-sm">Start First Interview</Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row — Quick Actions + Weak Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Quick Actions */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', background: a.color, border: `1px solid ${a.borderColor}`, textDecoration: 'none', transition: 'all 0.2s' }}>
                <span style={{ display: 'flex', color: 'var(--primary-light)' }}><a.Icon size={18} color="var(--primary-light)" /></span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'flex' }}><IconArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Focus Areas</div>
          {stats?.weakAreas?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.weakAreas.map((area, i) => (
                <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--danger-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{area}</span>
                  <span className="badge badge-danger">Improve</span>
                </div>
              ))}
              <div className="divider" />
              <div className="text-sm text-muted">Practice these in your next interview to boost your readiness score.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', color: 'var(--text-muted)' }}>
              <IconTarget size={36} color="var(--border)" />
              <p className="text-sm text-center">Complete interviews to identify areas to improve</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
