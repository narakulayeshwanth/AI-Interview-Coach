'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  IconRepeat, IconServer, IconUser, IconClock, IconBarChart2, IconLightbulb,
  IconCheckCircle, IconHistory, IconMicrophone, IconArrowRight, IconArrowLeft,
} from '@/lib/icons';


interface ReplayItem { index: number; questionText: string; answerText: string; feedback: { grammar: number; communication: number; confidence: number; technicalAccuracy: number; starScore: number; overall: number; suggestions: string[]; }; idealAnswer: string; whyBetter: string; timeTaken: number; }
interface ReplayData { sessionId: string; role: string; mode: string; company: string; difficulty: string; overallScore: number; createdAt: string; replay: ReplayItem[]; }

const DIM_COLORS: Record<string, string> = {
  grammar: 'var(--primary)', communication: 'var(--accent)', confidence: 'var(--success)',
  technicalAccuracy: 'var(--warning)', starScore: 'var(--danger)',
};

function FeedbackBadge({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color }}>{score}/10</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>{label}</div>
    </div>
  );
}

export default function ReplayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number[]>([0]);

  useEffect(() => {
    api.get<{ success: boolean; data: ReplayData }>(`/api/interview/replay/${id}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggle = (idx: number) =>
    setExpanded(e => e.includes(idx) ? e.filter(i => i !== idx) : [...e, idx]);

  if (loading) return (
    <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }} className="animate-float">
          <IconRepeat size={48} color="var(--primary)" />
        </div>
        <p className="text-secondary">Loading replay...</p>
      </div>
    </div>
  );
  if (!data) return <div className="page-inner"><p className="text-secondary">Replay not found.</p></div>;

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <IconRepeat size={26} color="var(--primary)" /> Interview Replay
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span className="badge badge-primary">{data.mode}</span>
            <span className="badge badge-muted">{data.role}</span>
            <span className="badge badge-muted" style={{ display:'flex',alignItems:'center',gap:'0.25rem' }}><IconServer size={11} /> {data.company}</span>
            <span className="badge badge-accent">Overall: {data.overallScore}/100</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(data.replay.map((_, i) => i))}>Expand All</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded([])}>Collapse All</button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/interview/results/${id}`)} style={{ gap:'0.25rem' }}>
            <IconArrowLeft size={13} /> Results
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.replay.map((item) => {
          const isOpen = expanded.includes(item.index - 1);
          const score = item.feedback.overall;
          const scoreColor = score >= 7 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--danger)';

          return (
            <div key={item.index} className="glass" style={{ overflow: 'hidden' }}>
              {/* Accordion Header */}
              <div
                onClick={() => toggle(item.index - 1)}
                style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-subtle)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                  Q{item.index}
                </div>
                <div style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.questionText}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: scoreColor }}>
                    {(score * 10).toFixed(0)}/100
                  </div>
                  <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                </div>
              </div>

              {/* Expanded Content */}
              {isOpen && (
                <div className="animate-fade-in">
                  {/* Your Answer */}
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(124,58,237,0.04)' }}>
                    <div className="replay-section-label" style={{ marginBottom: '0.5rem', display:'flex',alignItems:'center',gap:'0.5rem' }}>
                      <IconUser size={14} color="var(--primary)" /> Your Answer
                      {item.timeTaken > 0 && <span className="badge badge-muted" style={{ marginLeft: 'auto', display:'flex',alignItems:'center',gap:'0.25rem' }}><IconClock size={11} /> {item.timeTaken}s</span>}
                    </div>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{item.answerText}</p>
                  </div>

                  {/* Feedback Scores */}
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div className="replay-section-label" style={{ marginBottom: '0.75rem', display:'flex',alignItems:'center',gap:'0.5rem' }}>
                      <IconBarChart2 size={14} color="var(--primary)" /> AI Feedback
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
                      <FeedbackBadge label="Grammar"      score={item.feedback.grammar}           color={DIM_COLORS.grammar} />
                      <FeedbackBadge label="Communication" score={item.feedback.communication}     color={DIM_COLORS.communication} />
                      <FeedbackBadge label="Confidence"   score={item.feedback.confidence}         color={DIM_COLORS.confidence} />
                      <FeedbackBadge label="Technical"    score={item.feedback.technicalAccuracy}  color={DIM_COLORS.technicalAccuracy} />
                      <FeedbackBadge label="STAR"         score={item.feedback.starScore}          color={DIM_COLORS.starScore} />
                    </div>
                    {item.feedback.suggestions?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {item.feedback.suggestions.map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--warning)', flexShrink: 0, display:'flex' }}><IconLightbulb size={14} /></span> {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ideal Answer */}
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(16,185,129,0.04)' }}>
                    <div className="replay-section-label" style={{ marginBottom: '0.5rem', display:'flex',alignItems:'center',gap:'0.5rem' }}>
                      <IconCheckCircle size={14} color="var(--success)" /> Ideal Answer
                    </div>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{item.idealAnswer}</p>
                  </div>

                  {/* Why Better */}
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'rgba(6,182,212,0.04)' }}>
                    <div className="replay-section-label" style={{ marginBottom: '0.5rem', display:'flex',alignItems:'center',gap:'0.5rem' }}>
                      <IconLightbulb size={14} color="var(--accent)" /> Why It's Better
                    </div>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{item.whyBetter}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/interview/history')} style={{ gap:'0.375rem' }}><IconHistory size={15} /> All Sessions</button>
        <button className="btn btn-primary btn-lg" onClick={() => router.push('/interview/setup')} style={{ gap:'0.375rem' }}><IconMicrophone size={15} /> Practice Again <IconArrowRight size={15} /></button>
      </div>
    </div>
  );
}
