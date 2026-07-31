'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  IconFileText, IconUpload, IconSearch, IconTarget, IconCheckCircle,
  IconAlertTriangle, IconLightbulb, IconPen, IconMicrophone, IconLoader,
  IconArrowRight, IconBarChart2, IconRefresh, IconX,
} from '@/lib/icons';

interface Analysis {
  _id: string; atsScore: number; grammarScore: number; keywordScore: number;
  skillMatchScore: number; overallGrade: string;
  extractedSkills: string[]; missingSkills: string[];
  suggestions: string[]; formattingFeedback: string[]; actionVerbsFeedback: string;
}
interface JDMatch { matchPercentage: number; matchedSkills: string[]; missingSkills: string[]; extractedSkills: string[]; }

function ScoreBar({ label, value, color = 'var(--primary)' }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-sm font-semibold text-secondary">{label}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color }}>{value}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ResumePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging,  setDragging]  = useState(false);
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis,  setAnalysis]  = useState<Analysis | null>(null);
  const [error,     setError]     = useState('');
  const [jdText,    setJdText]    = useState('');
  const [jdMatch,   setJdMatch]   = useState<JDMatch | null>(null);
  const [matching,  setMatching]  = useState(false);
  const [tab,       setTab]       = useState<'analysis' | 'jd'>('analysis');

  const handleFile = (f: File) => {
    const ok = ['.pdf', '.doc', '.docx'].some(e => f.name.toLowerCase().endsWith(e));
    if (!ok) { setError('Only PDF and Word documents are allowed'); return; }
    setFile(f); setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await api.upload<{ success: boolean; data: Analysis }>('/api/resume/upload', fd);
      setAnalysis(res.data);
      setFile(null); // clear file after successful analysis
    } catch (err: any) {
      // Surface the backend error message clearly
      const msg = err.message || 'Upload failed. Please try again.';
      setError(msg);
      setFile(null); // let them pick again
    } finally { setUploading(false); }
  };

  const handleJDMatch = async () => {
    if (!jdText.trim() || !analysis) return;
    setMatching(true);
    try {
      const res = await api.post<{ success: boolean; data: JDMatch }>('/api/resume/jd-match', { jdText });
      setJdMatch(res.data);
    } catch (err: any) { setError(err.message); }
    finally { setMatching(false); }
  };

  const gradeColor = (g: string) => ({ A: 'var(--success)', B: 'var(--accent)', C: 'var(--warning)', D: 'var(--danger)' }[g] || 'var(--text-muted)');

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ display: 'flex', color: 'var(--primary)' }}><IconFileText size={26} color="var(--primary)" /></span>
          Resume Analyzer
        </h1>
        <p className="text-secondary text-sm">Upload your resume to get ATS score, skill gaps, and AI-powered improvement tips</p>
      </div>

      {/* Upload Zone */}
      {!analysis && (
        <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div
            id="resume-dropzone"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragging ? 'var(--primary-subtle)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <IconUpload size={48} color={dragging ? 'var(--primary)' : 'var(--border-strong)'} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Drop your resume here</h3>
            <p className="text-secondary text-sm">PDF or Word document &mdash; Max 5MB</p>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {file && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ display: 'flex', color: 'var(--primary)' }}><IconFileText size={20} color="var(--primary)" /></span>
                <span className="text-sm font-semibold">{file.name}</span>
                <span className="badge badge-muted">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
              <button id="resume-analyze-btn" className="btn btn-primary" onClick={handleUpload} disabled={uploading} style={{ gap: '0.375rem' }}>
                {uploading
                  ? <><IconLoader size={15} color="currentColor" /> Analyzing...</>
                  : <><IconSearch size={15} color="currentColor" /> Analyze Resume</>}
              </button>
            </div>
          )}
          {error && (
            <div style={{
              marginTop: '1rem', padding: '1rem 1.25rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            }}>
              <span style={{ display: 'flex', flexShrink: 0, color: 'var(--danger)', marginTop: '1px' }}>
                <IconAlertTriangle size={18} color="var(--danger)" />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Invalid File</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{error}</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setError(''); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                style={{ flexShrink: 0, fontSize: '0.8rem' }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="animate-fade-in-up">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            {(['analysis', 'jd'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)} style={{ gap: '0.375rem' }}>
                {t === 'analysis'
                  ? <><IconBarChart2 size={14} color="currentColor" /> Analysis Results</>
                  : <><IconTarget    size={14} color="currentColor" /> JD Matching</>}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', gap: '0.25rem' }} onClick={() => { setAnalysis(null); setFile(null); setJdMatch(null); }}>
              <IconRefresh size={13} /> Re-upload
            </button>
          </div>

          {tab === 'analysis' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              {/* Grade + Scores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div className="text-sm text-muted font-semibold" style={{ marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Grade</div>
                  <div style={{ fontSize: '4rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: gradeColor(analysis.overallGrade), lineHeight: 1, marginBottom: '0.5rem' }}>
                    {analysis.overallGrade}
                  </div>
                  <div className="text-sm text-secondary">Resume Grade</div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ScoreBar label="ATS Score"   value={analysis.atsScore}        color="var(--primary)" />
                  <ScoreBar label="Grammar"      value={analysis.grammarScore}    color="var(--accent)" />
                  <ScoreBar label="Keywords"     value={analysis.keywordScore}    color="var(--success)" />
                  <ScoreBar label="Skill Match"  value={analysis.skillMatchScore} color="var(--warning)" />
                </div>
              </div>

              {/* Skills + Suggestions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1.5rem' }}>
                  <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconCheckCircle size={14} color="var(--success)" /> Extracted Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {analysis.extractedSkills.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                  </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem' }}>
                  <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconAlertTriangle size={14} color="var(--warning)" /> Missing Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {analysis.missingSkills.length ? analysis.missingSkills.map(s => <span key={s} className="badge badge-danger">{s}</span>) : <span className="text-sm text-muted">No critical gaps found!</span>}
                  </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem' }}>
                  <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconLightbulb size={14} color="var(--accent)" /> AI Suggestions
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem' }}>
                    {analysis.suggestions.map((s, i) => <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s}</li>)}
                  </ul>
                </div>

                <div className="glass" style={{ padding: '1.5rem' }}>
                  <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconPen size={14} color="var(--primary)" /> Action Verbs
                  </div>
                  <p className="text-sm text-secondary">{analysis.actionVerbsFeedback}</p>
                </div>

                <button className="btn btn-primary" onClick={() => router.push('/interview/setup')} style={{ gap: '0.375rem' }}>
                  <IconMicrophone size={15} color="currentColor" /> Start Interview Based on This Resume <IconArrowRight size={15} color="currentColor" />
                </button>
              </div>
            </div>
          )}

          {tab === 'jd' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass" style={{ padding: '1.5rem' }}>
                <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paste Job Description</div>
                <textarea id="jd-textarea" className="textarea" placeholder="Paste the full job description here..." style={{ minHeight: '240px', marginBottom: '1rem' }} value={jdText} onChange={e => setJdText(e.target.value)} />
                <button id="jd-match-btn" className="btn btn-primary w-full" onClick={handleJDMatch} disabled={matching || !jdText.trim()} style={{ gap: '0.375rem' }}>
                  {matching
                    ? <><IconLoader size={15} color="currentColor" /> Matching...</>
                    : <><IconTarget size={15} color="currentColor" /> Match with Resume</>}
                </button>
              </div>

              <div>
                {jdMatch ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: jdMatch.matchPercentage >= 70 ? 'var(--success)' : jdMatch.matchPercentage >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                        {jdMatch.matchPercentage}%
                      </div>
                      <div className="text-sm text-secondary">JD vs Resume Match</div>
                    </div>

                    <div className="glass" style={{ padding: '1.25rem' }}>
                      <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <IconCheckCircle size={14} color="var(--success)" /> Matched Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {jdMatch.matchedSkills.map(s => <span key={s} className="badge badge-success">{s}</span>)}
                      </div>
                    </div>

                    <div className="glass" style={{ padding: '1.25rem' }}>
                      <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <IconX size={14} color="var(--danger)" /> Skills to Add
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {jdMatch.missingSkills.map(s => <span key={s} className="badge badge-danger">{s}</span>)}
                      </div>
                    </div>

                    <button className="btn btn-primary" onClick={() => { localStorage.setItem('jdContext', jdText); router.push('/interview/setup'); }} style={{ gap: '0.375rem' }}>
                      <IconMicrophone size={15} color="currentColor" /> Practice Interview for This JD <IconArrowRight size={15} color="currentColor" />
                    </button>
                  </div>
                ) : (
                  <div className="glass" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                    <IconTarget size={48} color="var(--border)" />
                    <p className="text-sm text-center">Paste a job description and click Match to see how well your resume aligns</p>
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
