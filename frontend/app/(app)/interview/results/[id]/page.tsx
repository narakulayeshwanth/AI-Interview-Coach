'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { IconBarChart2, IconServer, IconClock, IconZap, IconRepeat, IconDownload, IconHistory, IconMicrophone, IconArrowRight, IconListCheck } from '@/lib/icons';


interface Report {
  session: { role: string; mode: string; company: string; difficulty: string; overallScore: number; duration: number; xpEarned: number; weakAreas: string[]; improvementPlan: string[]; createdAt: string; };
  breakdown: { label: string; score: number }[];
  totalAnswers: number;
}

const DIM_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: '2rem', color: 'var(--text-muted)', lineHeight: 1, marginBottom: '0.5rem' }}>/100</div>
      <div className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44`, fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}>{label}</div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: Report }>(`/api/report/${id}`)
      .then(r => setReport(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { backgroundColor: '#050810', scale: 1.5 });
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/png');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`interview-report-${id?.toString().slice(-6)}.pdf`);
  };

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const radarData = report?.breakdown.map(b => ({ skill: b.label, score: b.score }));

  if (loading) return (
    <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }} className="animate-float">
          <IconBarChart2 size={48} color="var(--primary)" />
        </div>
        <p className="text-secondary">Generating your report...</p>
      </div>
    </div>
  );

  if (!report) return <div className="page-inner"><p className="text-secondary">Report not found.</p></div>;

  return (
    <div className="page-inner animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <IconBarChart2 size={26} color="var(--primary)" /> Interview Results
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <span className="badge badge-primary">{report.session.mode}</span>
            <span className="badge badge-muted">{report.session.role}</span>
            <span className="badge badge-muted" style={{ display:'flex',alignItems:'center',gap:'0.25rem' }}><IconServer size={11} /> {report.session.company}</span>
            <span className="badge badge-muted" style={{ display:'flex',alignItems:'center',gap:'0.25rem' }}><IconClock size={11} /> {fmtDuration(report.session.duration)}</span>
            <span className="badge badge-accent" style={{ display:'flex',alignItems:'center',gap:'0.25rem' }}><IconZap size={11} /> +{report.session.xpEarned} XP</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button id="replay-btn" className="btn btn-secondary" onClick={() => router.push(`/interview/replay/${id}`)} style={{ gap:'0.375rem' }}><IconRepeat size={15} /> Replay</button>
          <button id="export-pdf-btn" className="btn btn-primary" onClick={handleExportPDF} style={{ gap:'0.375rem' }}><IconDownload size={15} /> Export PDF</button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* Score + Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ScoreGauge score={report.session.overallScore} />
            <div className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Overall Interview Score</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {report.session.weakAreas.slice(0, 3).map(a => <span key={a} className="badge badge-danger">{a}</span>)}
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dimension Breakdown</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={report.breakdown} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}/100`, '']} contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {report.breakdown.map((_, i) => <Cell key={i} fill={DIM_COLORS[i % DIM_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar + Improvement Plan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skill Radar</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass" style={{ padding: '1.5rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <IconListCheck size={14} color="var(--primary)" /> Improvement Plan
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem' }}>
              {report.session.improvementPlan.map((item, i) => (
                <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{i + 1}.</strong> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', paddingTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/interview/history')} style={{ gap:'0.375rem' }}><IconHistory size={15} /> View History</button>
        <button className="btn btn-primary btn-lg" onClick={() => router.push('/interview/setup')} style={{ gap:'0.375rem' }}><IconMicrophone size={15} /> Practice Again <IconArrowRight size={15} /></button>
      </div>
    </div>
  );
}
