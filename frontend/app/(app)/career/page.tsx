'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { IconRocket, IconMicrophone, IconCalendar, IconFlame, IconZap, IconTrophy, IconTarget, IconTool, IconBook, IconClock } from '@/lib/icons';


interface Recommendation { role: string; matchPercent: number; reason: string; }
interface WeakArea { area: string; priority: 'high' | 'medium' | 'low'; tip: string; }
interface Course { title: string; platform: string; url: string; duration: string; level: string; }
interface Project { title: string; description: string; skills: string[]; difficulty: string; }
interface StudyPlan { thirtyDay: string[]; sixtyDay: string[]; ninetyDay: string[]; }

interface CareerData {
  careerRecommendations: Recommendation[];
  weakAreas: WeakArea[];
  recommendedCourses: Course[];
  recommendedProjects: Project[];
  studyPlan: StudyPlan;
  interviewReadiness: number;
}

export default function CareerPage() {
  const [data, setData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: CareerData }>('/api/career/coach')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-inner">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-xl)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-inner animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <IconRocket size={26} color="var(--primary)" /> AI Career Coach
          </h1>
          <p className="text-secondary text-sm">Personalized career pathways, project recommendations, and study roadmaps</p>
        </div>
        <Link href="/interview/setup" className="btn btn-primary" style={{ gap: '0.375rem' }}>
          <IconMicrophone size={15} /> Start Interview Prep
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }}>
        {/* Left Side — Readiness & Study Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Readiness Card */}
          <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', textAlign: 'left' }}>
              Interview Readiness
            </div>
            <div style={{ display: 'inline-flex', position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent)' }}>{data?.interviewReadiness}%</div>
            </div>
            <p className="text-sm text-secondary">Your overall readiness for your target role based on interviews and resume.</p>
          </div>

          {/* Study Plan */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconCalendar size={14} color="var(--primary)" /> AI Study Roadmap
            </div>
            {data?.studyPlan && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconFlame size={14} /> Days 1 – 30
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.25rem' }}>
                    {data.studyPlan.thirtyDay.map((item, idx) => <li key={idx} className="text-sm text-secondary">{item}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ color: 'var(--accent-light)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconZap size={14} /> Days 31 – 60
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.25rem' }}>
                    {data.studyPlan.sixtyDay.map((item, idx) => <li key={idx} className="text-sm text-secondary">{item}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconTrophy size={14} /> Days 61 – 90
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.25rem' }}>
                    {data.studyPlan.ninetyDay.map((item, idx) => <li key={idx} className="text-sm text-secondary">{item}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side — Roles, Weak areas, Projects & Courses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Career Recommendations */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconTarget size={14} color="var(--primary)" /> Recommended Career Paths
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data?.careerRecommendations.map(rec => (
                <div key={rec.role} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)' }}>{rec.matchPercent}%</div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Match</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rec.role}</div>
                    <div className="text-sm text-secondary">{rec.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Projects */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconTool size={14} color="var(--accent)" /> Recommended Projects to Build
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {data?.recommendedProjects.map(proj => (
                <div key={proj.title} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700 }}>{proj.title}</div>
                    <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{proj.difficulty}</span>
                  </div>
                  <p className="text-sm text-secondary" style={{ marginBottom: '0.75rem' }}>{proj.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {proj.skills.map(s => <span key={s} className="badge badge-muted">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Courses */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconBook size={14} color="var(--primary)" /> Suggested Training Courses
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {data?.recommendedCourses.map(course => {
                const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(course.platform + ' ' + course.title + ' course')}`;
                return (
                  <a key={course.title} href={targetUrl} target="_blank" rel="noreferrer" className="glass" style={{ padding: '1rem', display: 'block', textDecoration: 'none', transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{course.title}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">{course.platform}</span>
                      <span className="badge badge-muted">{course.level}</span>
                    </div>
                    <div className="text-xs text-muted" style={{ display:'flex',alignItems:'center',gap:'0.25rem' }}><IconClock size={11} /> {course.duration}</div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
