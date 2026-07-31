'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  IconMicrophone, IconResume, IconTarget, IconActivity,
  IconHistory, IconRepeat, IconZap, IconClock,
  IconCheckCircle, IconInfo, IconAward, IconArrowRight,
} from '@/lib/icons';

interface Mission {
  id: string;
  title: string;
  desc: string;
  icon: string;
  xp: number;
  type: string;
  completed: boolean;
  progress: number;
  total: number;
}

interface MissionsData {
  missions: Mission[];
  totalXPToday: number;
  date: string;
}

// Map mission type → SVG icon component
function MissionIcon({ type, completed }: { type: string; completed: boolean }) {
  const color = completed ? 'var(--success)' : 'var(--primary-light)';
  const size = 20;
  switch (type) {
    case 'interview': return <IconMicrophone size={size} color={color} />;
    case 'resume':    return <IconResume     size={size} color={color} />;
    case 'score':     return <IconTarget     size={size} color={color} />;
    case 'voice':     return <IconActivity   size={size} color={color} />;
    case 'replay':    return <IconRepeat     size={size} color={color} />;
    default:          return <IconTarget     size={size} color={color} />;
  }
}

function getMissionLink(type: string): string {
  switch (type) {
    case 'resume':  return '/resume';
    case 'replay':  return '/interview/history';
    default:        return '/interview/setup';
  }
}

function formatResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function MissionsPage() {
  const [data, setData]       = useState<MissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(formatResetTime());

  useEffect(() => {
    api.get<{ success: boolean; data: MissionsData }>('/api/gamification/missions')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(formatResetTime()), 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="page-inner" style={{ maxWidth: 860 }}>
      <div className="skeleton" style={{ height: 56, marginBottom: '2rem', borderRadius: 'var(--radius-md)' }} />
      <div className="skeleton" style={{ height: 110, marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 90, marginBottom: '1rem', borderRadius: 'var(--radius-md)' }} />
      ))}
    </div>
  );

  const missions        = data?.missions ?? [];
  const completedCount  = missions.filter(m => m.completed).length;
  const totalCount      = missions.length;
  const progressPct     = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalXP         = data?.totalXPToday ?? 0;
  const maxPossibleXP   = missions.reduce((s, m) => s + m.xp, 0);

  return (
    <div className="page-inner animate-fade-in" style={{ maxWidth: 860 }}>

      {/* ── Page Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ display: 'flex', color: 'var(--primary)' }}><IconTarget size={28} color="var(--primary)" /></span>
            Daily Missions
          </h1>
          <p className="text-secondary text-sm">Complete daily tasks to earn XP and level up your status</p>
        </div>

        {/* Reset countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ display: 'flex', color: 'var(--text-muted)' }}><IconClock size={16} /></span>
          <div>
            <div className="text-xs text-muted" style={{ lineHeight: 1.2 }}>Resets in</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-light)' }}>{timeLeft}</div>
          </div>
        </div>
      </div>

      {/* ── Summary Card ─────────────────────────────────── */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.04) 100%)', borderColor: 'rgba(249,115,22,0.2)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconTarget size={24} color="var(--primary)" />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Daily Quest Progress</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: completedCount === totalCount ? 'var(--success)' : 'var(--primary-light)' }}>
                {completedCount} / {totalCount} completed
              </span>
            </div>
            <div style={{ width: '100%', height: 10, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: completedCount === totalCount ? 'var(--success)' : 'var(--grad-primary)', borderRadius: 2, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '0.4rem' }}>
              {progressPct}% complete &bull; {totalCount - completedCount} remaining
            </div>
          </div>

          <div className="divider-v" style={{ height: 60, alignSelf: 'center' }} />

          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
              +{totalXP}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>XP Earned Today</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              of <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{maxPossibleXP}</span> possible
            </div>
          </div>
        </div>
      </div>

      {/* ── Missions List ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {missions.length === 0 ? (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <IconTarget size={48} color="var(--border)" />
            </div>
            <p>No missions available today. Check back tomorrow!</p>
          </div>
        ) : missions.map((m) => {
          const pct = m.total > 0 ? Math.round((m.progress / m.total) * 100) : 0;
          return (
            <div
              key={m.id}
              className="glass"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                borderColor: m.completed ? 'rgba(34,197,94,0.3)' : 'var(--border)',
                background: m.completed ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Completed accent stripe */}
              {m.completed && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--success)' }} />
              )}

              {/* Icon box */}
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: m.completed ? 'rgba(34,197,94,0.12)' : 'var(--primary-subtle)',
                border: `1px solid ${m.completed ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MissionIcon type={m.type} completed={m.completed} />
              </div>

              {/* Title + desc + progress bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: '0.9375rem',
                  color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: m.completed ? 'line-through' : 'none',
                  marginBottom: '0.15rem',
                }}>
                  {m.title}
                </div>
                <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>{m.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', maxWidth: 300 }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: m.completed ? 'var(--success)' : 'var(--grad-primary)', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                  <span className="text-xs" style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontWeight: 600, minWidth: 40 }}>
                    {m.progress} / {m.total}
                  </span>
                </div>
              </div>

              {/* XP badge + action button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.35rem 0.75rem',
                  background: m.completed ? 'rgba(34,197,94,0.12)' : 'var(--primary-subtle)',
                  border: `1px solid ${m.completed ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.25)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700, fontSize: '0.8125rem',
                  color: m.completed ? 'var(--success)' : 'var(--primary-light)',
                  whiteSpace: 'nowrap',
                }}>
                  <IconZap size={13} color={m.completed ? 'var(--success)' : 'var(--primary-light)'} />
                  +{m.xp} XP
                </div>

                {m.completed ? (
                  <div style={{
                    width: 80, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                    background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600,
                  }}>
                    <IconCheckCircle size={15} color="var(--success)" />
                    Done
                  </div>
                ) : (
                  <Link
                    href={getMissionLink(m.type)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: 80, justifyContent: 'center', fontWeight: 700, gap: '0.25rem' }}
                  >
                    Go <IconArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── All Done Banner ───────────────────────────────── */}
      {completedCount > 0 && completedCount === totalCount && (
        <div className="glass animate-fade-in-up" style={{
          marginTop: '1.5rem', padding: '1.5rem', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(249,115,22,0.06))',
          borderColor: 'rgba(34,197,94,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.625rem' }}>
            <IconAward size={40} color="var(--success)" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--success)' }}>
            All missions complete!
          </div>
          <div className="text-sm text-muted">
            You&apos;ve earned <strong style={{ color: 'var(--primary-light)' }}>+{totalXP} XP</strong> today. Come back tomorrow for new missions.
          </div>
        </div>
      )}

      {/* ── Info Footer ───────────────────────────────────── */}
      <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ display: 'flex', flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }}><IconInfo size={16} /></span>
        <p className="text-xs text-muted" style={{ lineHeight: 1.6, margin: 0 }}>
          Missions reset every day at <strong style={{ color: 'var(--text-secondary)' }}>midnight</strong>.
          Complete all missions for a <strong style={{ color: 'var(--primary-light)' }}>daily bonus</strong> streak multiplier!
          XP earned here counts toward your level and leaderboard rank.
        </p>
      </div>
    </div>
  );
}
