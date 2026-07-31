'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { IconTrophy, IconFlame, IconZap, IconMedal1, IconMedal2, IconMedal3 } from '@/lib/icons';

interface LeaderboardUser {
  _id: string; name: string; xp: number; level: number; streak: number; rank?: number;
}

function PodiumIcon({ placement }: { placement: string }) {
  if (placement === 'first')  return <IconMedal1 size={22} color="#ffd700" />;
  if (placement === 'second') return <IconMedal2 size={22} color="#c0c0c0" />;
  return <IconMedal3 size={22} color="#cd7f32" />;
}

const PODIUM_COLORS: Record<string, string> = {
  first: '#ffd700', second: '#c0c0c0', third: '#cd7f32',
};
const PODIUM_HEIGHTS: Record<string, number> = {
  first: 130, second: 100, third: 85,
};

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: { users: LeaderboardUser[] } }>('/api/gamification/leaderboard')
      .then(res => {
        const sorted = (res.data.users || []).map((u, idx) => ({ ...u, rank: idx + 1 }));
        setUsers(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-inner">
      <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-xl)' }} />
    </div>
  );

  const top3   = users.slice(0, 3);
  const others = users.slice(3);

  // Order: 2nd left, 1st center, 3rd right
  const podium = [
    top3[1] ? { ...top3[1], placement: 'second' } : null,
    top3[0] ? { ...top3[0], placement: 'first'  } : null,
    top3[2] ? { ...top3[2], placement: 'third'  } : null,
  ].filter(Boolean) as (LeaderboardUser & { placement: string })[];

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <span style={{ display: 'flex', color: 'var(--primary)' }}><IconTrophy size={24} color="var(--primary)" /></span>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.1rem' }}>Global Leaderboard</h1>
          <p className="text-secondary text-sm">Compete with job seekers worldwide, earn XP, and climb the rankings</p>
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', padding: '2rem 0', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
          {podium.map((p) => {
            const color  = PODIUM_COLORS[p.placement];
            const height = PODIUM_HEIGHTS[p.placement];
            return (
              <div key={p._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 140 }}>
                <div style={{ position: 'relative', marginBottom: '1rem', width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', boxShadow: `0 0 20px ${color}44` }}>
                  {p.name.charAt(0).toUpperCase()}
                  <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', display: 'flex' }}>
                    <PodiumIcon placement={p.placement} />
                  </div>
                </div>
                <div style={{ fontWeight: 700, textAlign: 'center', fontSize: '0.9rem', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Level {p.level}</div>
                <div style={{ width: '100%', height, background: `linear-gradient(180deg, ${color}33 0%, rgba(255,255,255,0.02) 100%)`, border: `1px solid ${color}55`, borderBottom: 'none', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.xp}</span>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoreboard */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 1fr', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
            <div>Rank</div><div>User</div>
            <div style={{ textAlign: 'center' }}>Level</div>
            <div style={{ textAlign: 'center' }}>Streak</div>
            <div style={{ textAlign: 'right' }}>Total XP</div>
          </div>
          {others.map((item) => {
            const isMe = currentUser?._id === item._id;
            return (
              <div key={item._id} style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 1fr 1fr 1fr', padding: '1rem', borderRadius: 'var(--radius-md)', background: isMe ? 'var(--primary-subtle)' : 'transparent', border: isMe ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent', alignItems: 'center', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-muted)' }}>#{item.rank}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, color: isMe ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                    {item.name} {isMe && ' (You)'}
                  </span>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Level {item.level}</div>
                <div style={{ textAlign: 'center', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <IconFlame size={13} color="var(--warning)" /> {item.streak}d
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', color: 'var(--accent)' }}>
                  <IconZap size={13} color="var(--accent)" /> {item.xp}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
