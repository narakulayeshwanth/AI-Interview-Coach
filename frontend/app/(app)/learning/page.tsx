'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IconBook, IconGraduationCap, IconTerminal, IconYoutube, IconFileText, IconVideo, IconClock, IconTarget } from '@/lib/icons';


interface YouTubeResource { title: string; channel: string; url: string; duration: string; }
interface ArticleResource { title: string; source: string; url: string; }
interface LeetCodeResource { title: string; difficulty: string; url: string; problems: number; }

interface Topic {
  name: string;
  priority: 'high' | 'medium' | 'low';
  youtube: YouTubeResource[];
  articles: ArticleResource[];
  leetcode: LeetCodeResource[];
  roadmap: string;
  estimatedTime: string;
}

interface LearningData {
  topics: Topic[];
  totalTopics: number;
}

export default function LearningPage() {
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Fetch dashboard stats to get weak areas
        const statsRes = await api.get<{ success: boolean; data: { weakAreas: string[]; targetRole: string } }>('/api/dashboard/stats');
        const weakAreas = statsRes.data.weakAreas || [];
        
        // Fetch curated resources for weak areas
        const learningRes = await api.post<{ success: boolean; data: LearningData }>('/api/learning/resources', {
          weakAreas,
          role: statsRes.data.targetRole || 'Software Developer'
        });
        
        setData(learningRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="page-inner">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
        <div className="skeleton" style={{ height: 450, borderRadius: 'var(--radius-xl)' }} />
      </div>
    </div>
  );

  const activeTopic = data?.topics[activeTopicIdx];

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ display: 'flex', color: 'var(--primary)' }}><IconBook size={26} color="var(--primary)" /></span>
          Learning Hub
        </h1>
        <p className="text-secondary text-sm">Curated study guides, coding practices, and tutorials targeted to your weak areas</p>
      </div>

      {!data?.topics.length ? (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <IconGraduationCap size={48} color="var(--border)" />
          </div>
          <h3>Your curriculum is clear!</h3>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Complete a mock interview to identify skills and generate customized study plans.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Sidebar Topics list */}
          <div className="glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="text-xs font-semibold text-muted" style={{ padding: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topics Focus</div>
            {data.topics.map((t, idx) => (
              <div
                key={t.name}
                onClick={() => setActiveTopicIdx(idx)}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: activeTopicIdx === idx ? 'var(--primary-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeTopicIdx === idx ? 'rgba(124,58,237,0.2)' : 'transparent',
                  color: activeTopicIdx === idx ? 'var(--primary-light)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{t.name}</span>
                <span className={`badge ${t.priority === 'high' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>{t.priority}</span>
              </div>
            ))}
          </div>

          {/* Right Main Focus Area Details */}
          {activeTopic && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Overview & Roadmap */}
              <div className="glass" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2>{activeTopic.name}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <IconClock size={11} color="currentColor" /> {activeTopic.estimatedTime}
                    </span>
                    <span className="badge badge-accent">Priority: {activeTopic.priority}</span>
                  </div>
                </div>
                <div className="divider" style={{ margin: '0.75rem 0' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <IconTarget size={14} color="var(--primary)" /> Study Plan & Roadmap:
                </div>
                <p className="text-sm text-secondary">{activeTopic.roadmap}</p>
              </div>

              {/* Resources (YouTube, Leetcode, Articles) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {/* Leetcode practice */}
                {activeTopic.leetcode && activeTopic.leetcode.length > 0 && (
                  <div className="glass" style={{ padding: '1.5rem' }}>
                    <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <IconTerminal size={14} color="var(--accent)" /> Coding Practice (LeetCode)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeTopic.leetcode.map(lc => {
                        const targetUrl = lc.url && lc.url.startsWith('https://leetcode.com') 
                          ? lc.url 
                          : `https://www.google.com/search?q=${encodeURIComponent('Leetcode ' + lc.title)}`;
                        return (
                          <a key={lc.title} href={targetUrl} target="_blank" rel="noreferrer" className="glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lc.title}</div>
                              <div className="text-xs text-muted">{lc.problems} interview questions</div>
                            </div>
                            <span className="badge badge-accent">{lc.difficulty}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* YouTube guides */}
                {activeTopic.youtube && activeTopic.youtube.length > 0 && (
                  <div className="glass" style={{ padding: '1.5rem' }}>
                    <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <IconYoutube size={14} color="#ff0000" /> Video Courses & Tutorials
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {activeTopic.youtube.map(yt => {
                        // Check if it's one of our verified local database URLs, otherwise route via YouTube search
                        const isVerified = yt.url && (
                          yt.url === 'https://youtube.com/watch?v=CCqvu3V5mhY' ||
                          yt.url === 'https://youtube.com/watch?v=e5HO7fkG49E' ||
                          yt.url === 'https://youtube.com/watch?v=0163cssUxLA' ||
                          yt.url === 'https://youtube.com/watch?v=RBSGKlAvoiM' ||
                          yt.url === 'https://youtube.com/watch?v=HAnw168huqA' ||
                          yt.url === 'https://youtube.com/watch?v=MUCfmMpMFuQ'
                        );
                        const targetUrl = isVerified 
                          ? yt.url 
                          : `https://www.youtube.com/results?search_query=${encodeURIComponent(yt.title + ' ' + (yt.channel || ''))}`;
                        return (
                          <a key={yt.title} href={targetUrl} target="_blank" rel="noreferrer" className="glass" style={{ padding: '1rem', display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{yt.title}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                              <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <IconVideo size={11} color="currentColor" /> {yt.channel}
                              </span>
                              <span className="badge badge-muted">{yt.duration}</span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Articles */}
                {activeTopic.articles && activeTopic.articles.length > 0 && (
                  <div className="glass" style={{ padding: '1.5rem' }}>
                    <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <IconFileText size={14} color="var(--primary)" /> Articles & Guides
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {activeTopic.articles.map(art => {
                        const isVerified = art.url && (
                          art.url.includes('themuse.com') ||
                          art.url.includes('indeed.com') ||
                          art.url.includes('github.com/donnemartin') ||
                          art.url.includes('techinterviewhandbook.org') ||
                          art.url.includes('hbr.org')
                        );
                        const targetUrl = isVerified 
                          ? art.url 
                          : `https://www.google.com/search?q=${encodeURIComponent(art.title + ' ' + (art.source || ''))}`;
                        return (
                          <a key={art.title} href={targetUrl} target="_blank" rel="noreferrer" className="glass" style={{ padding: '1rem', display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{art.title}</div>
                            <span className="badge badge-primary">{art.source}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
