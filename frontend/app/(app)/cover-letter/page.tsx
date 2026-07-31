'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { IconEnvelope, IconLoader, IconArrowRight, IconCheckCircle, IconCopy, IconSparkles, IconLightbulb } from '@/lib/icons';


interface CoverLetterData {
  coverLetter: string;
  subjectLine: string;
  highlights: string[];
  tipsForCustomization: string[];
}

export default function CoverLetterPage() {
  const [form, setForm] = useState({ companyName: '', role: '', tone: 'professional', jobDescription: '' });
  const [data, setData] = useState<CoverLetterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setData(null);
    try {
      const res = await api.post<{ success: boolean; data: CoverLetterData }>('/api/tools/cover-letter', form);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    const textToCopy = `Subject: ${data.subjectLine}\n\n${data.coverLetter}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <IconEnvelope size={26} color="var(--primary)" /> AI Cover Letter Generator
        </h1>
        <p className="text-secondary text-sm">Generate a customized, achievement-focused cover letter tailored to a target role and company</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Form */}
        <form onSubmit={handleGenerate} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Target Company</label>
            <input
              id="cl-company"
              className="input"
              type="text"
              placeholder="e.g. Google"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Role</label>
            <input
              id="cl-role"
              className="input"
              type="text"
              placeholder="e.g. Frontend Engineer"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Letter Tone</label>
            <select
              id="cl-tone"
              className="select input"
              value={form.tone}
              onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}
            >
              <option value="professional">Professional & Confident</option>
              <option value="creative">Creative & Enthusiastic</option>
              <option value="technical">Highly Technical & Analytical</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Job Description (Recommended)</label>
            <textarea
              id="cl-jd"
              className="textarea"
              placeholder="Paste job description here to optimize for ATS..."
              style={{ minHeight: '120px' }}
              value={form.jobDescription}
              onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button id="cl-generate-btn" type="submit" className="btn btn-primary w-full" disabled={loading} style={{ gap: '0.375rem' }}>
            {loading
              ? <><IconLoader size={15} color="currentColor" /> Generating Letter...</>
              : <><IconSparkles size={15} color="currentColor" /> Generate Cover Letter <IconArrowRight size={15} color="currentColor" /></>}
          </button>
        </form>

        {/* Right Output */}
        <div>
          {data ? (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Main Letter */}
              <div className="glass" style={{ padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary-light)', fontSize: '1rem' }}>
                    Generated Letter
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleCopy} style={{ gap: '0.375rem' }}>
                    {copied
                      ? <><IconCheckCircle size={13} color="var(--success)" /> Copied!</>
                      : <><IconCopy size={13} color="currentColor" /> Copy Letter</>}
                  </button>
                </div>

                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  Subject: {data.subjectLine}
                </div>

                <div className="text-sm text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  {data.coverLetter}
                </div>
              </div>

              {/* Highlights & Customization Tips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass" style={{ padding: '1.25rem' }}>
                  <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconSparkles size={12} color="var(--accent)" /> Key Highlights Focus
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {data.highlights.map((h, i) => <li key={i} className="text-xs text-secondary">{h}</li>)}
                  </ul>
                </div>

                <div className="glass" style={{ padding: '1.25rem' }}>
                  <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <IconLightbulb size={12} color="var(--accent)" /> Customize Tips
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {data.tipsForCustomization.map((t, i) => <li key={i} className="text-xs text-secondary">{t}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass" style={{ padding: '4rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
              <IconEnvelope size={48} color="var(--border)" />
              <p className="text-sm text-center">Fill in the role details and click Generate to create a tailor-made cover letter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
