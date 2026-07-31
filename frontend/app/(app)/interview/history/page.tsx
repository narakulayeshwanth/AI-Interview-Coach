'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  IconMicrophone, IconUserCheck, IconTerminal, IconHeadphones, IconUsers,
  IconServer, IconMessageCircle, IconHistory, IconArrowRight, IconArrowLeft,
  IconRepeat, IconVolume, IconX,
} from '@/lib/icons';

interface Session {
  _id: string; role: string; mode: string; company: string;
  difficulty: string; overallScore: number; duration: number;
  inputMode: string; createdAt: string;
}

function ModeIcon({ mode }: { mode: string }) {
  const size = 20;
  const color = 'var(--primary-light)';
  switch (mode) {
    case 'hr':               return <IconUserCheck    size={size} color={color} />;
    case 'technical':        return <IconTerminal     size={size} color={color} />;
    case 'behavioral':       return <IconHeadphones   size={size} color={color} />;
    case 'managerial':       return <IconUsers        size={size} color={color} />;
    case 'system_design':    return <IconServer       size={size} color={color} />;
    case 'group_discussion': return <IconMessageCircle size={size} color={color} />;
    default:                 return <IconMicrophone   size={size} color={color} />;
  }
}

const DIFF_COLOR: Record<string, string> = {
  easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--danger)',
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ mode: '', role: '' });
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const PER_PAGE = 10;

  const loadSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE), ...(filter.mode && { mode: filter.mode }), ...(filter.role && { role: filter.role }) });
      const res = await api.get<{ success: boolean; data: Session[]; total: number }>(`/api/interview/history?${params}`);
      setSessions(res.data); setTotal(res.total);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadSessions(); }, [page, filter]);

  const fmtDate     = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDur      = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const scoreColor  = (s: number) => s >= 70 ? 'var(--success)' : s >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ display: 'flex', color: 'var(--primary)' }}><IconHistory size={26} color="var(--primary)" /></span>
            Interview History
          </h1>
          <p className="text-secondary text-sm">{total} sessions completed</p>
        </div>
        <Link href="/interview/setup" className="btn btn-primary" style={{ gap: '0.375rem' }}>
          <IconMicrophone size={15} color="currentColor" /> New Interview
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select id="filter-mode" className="select input" style={{ width: 'auto', minWidth: 160 }} value={filter.mode} onChange={e => { setFilter(f => ({ ...f, mode: e.target.value })); setPage(1); }}>
          <option value="">All Modes</option>
          {['hr', 'technical', 'behavioral', 'managerial', 'system_design', 'group_discussion'].map(m => (
            <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        {filter.mode && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ mode: '', role: '' })} style={{ gap: '0.25rem' }}>
            <IconX size={12} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <IconHistory size={48} color="var(--border)" />
          </div>
          <h3>No interviews yet</h3>
          <p className="text-secondary" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Start your first mock interview to build your history</p>
          <Link href="/interview/setup" className="btn btn-primary">Start First Interview <IconArrowRight size={14} /></Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.map((s) => (
              <div key={s._id} className="glass" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Mode icon box */}
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ModeIcon mode={s.mode} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{s.role}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{s.mode.replace(/_/g, ' ')}</span>
                    <span className="badge badge-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <IconServer size={11} color="currentColor" /> {s.company}
                    </span>
                    <span className="badge" style={{ background: `${DIFF_COLOR[s.difficulty]}22`, color: DIFF_COLOR[s.difficulty] }}>{s.difficulty}</span>
                    {s.inputMode === 'voice' && (
                      <span className="badge badge-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <IconVolume size={11} color="currentColor" /> Voice
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: scoreColor(s.overallScore) }}>{s.overallScore}/100</div>
                  <div className="text-xs text-muted">{fmtDate(s.createdAt)}</div>
                  <div className="text-xs text-muted">{fmtDur(s.duration)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <Link href={`/interview/results/${s._id}`} className="btn btn-ghost btn-sm">Results</Link>
                  <Link href={`/interview/replay/${s._id}`} className="btn btn-secondary btn-sm" style={{ gap: '0.25rem' }}>
                    <IconRepeat size={13} /> Replay
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > PER_PAGE && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ gap: '0.25rem' }}>
                <IconArrowLeft size={13} /> Prev
              </button>
              <span className="text-sm text-secondary" style={{ padding: '0.5rem 1rem' }}>Page {page} of {Math.ceil(total / PER_PAGE)}</span>
              <button className="btn btn-ghost btn-sm" disabled={page * PER_PAGE >= total} onClick={() => setPage(p => p + 1)} style={{ gap: '0.25rem' }}>
                Next <IconArrowRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
