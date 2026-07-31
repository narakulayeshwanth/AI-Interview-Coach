'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import React from 'react';
import {
  IconUserCheck, IconTerminal, IconHeadphones, IconServer, IconGrid, IconMessageCircle,
  IconMonitor, IconDatabase, IconLayers2, IconCode2, IconCpu2, IconCloud,
  IconTool, IconTrendUp, IconPieChart, IconPen, IconShield, IconBriefcase2,
  IconFlask, IconLayout, IconSearch, IconUsers,
  IconStar2, IconBuilding, IconRocket, IconUniversity, IconAward2, IconGraduate, IconPackage,
  IconType, IconVolume, IconMicrophone, IconArrowLeft, IconArrowRight,
  IconLoader,
} from '@/lib/icons';

interface ModeItem { id: string; Icon: React.FC<any>; label: string; desc: string; }
interface RoleItem { id: string; Icon: React.FC<any>; }
interface CatItem  { label: string; Icon: React.FC<any>; companies: string[]; }

const MODES: ModeItem[] = [
  { id: 'hr',               Icon: IconUserCheck,    label: 'HR Interview',      desc: 'Culture fit & soft skills' },
  { id: 'technical',        Icon: IconTerminal,     label: 'Technical',          desc: 'DSA & concepts' },
  { id: 'behavioral',       Icon: IconHeadphones,   label: 'Behavioral',         desc: 'STAR method situations' },
  { id: 'managerial',       Icon: IconUsers,        label: 'Managerial',         desc: 'Leadership & decisions' },
  { id: 'system_design',    Icon: IconServer,       label: 'System Design',      desc: 'Architecture questions' },
  { id: 'group_discussion', Icon: IconMessageCircle,label: 'Group Discussion',   desc: 'Topic debates' },
];

const ROLES: RoleItem[] = [
  { id: 'Frontend Developer',        Icon: IconMonitor    },
  { id: 'Backend Developer',         Icon: IconDatabase   },
  { id: 'Full Stack Developer',      Icon: IconLayers2    },
  { id: 'Python Developer',          Icon: IconCode2      },
  { id: 'Java Developer',            Icon: IconCode2      },
  { id: 'AI Engineer',               Icon: IconCpu2       },
  { id: 'Machine Learning Engineer', Icon: IconPieChart   },
  { id: 'Cloud Engineer',            Icon: IconCloud      },
  { id: 'DevOps Engineer',           Icon: IconTool       },
  { id: 'Data Analyst',              Icon: IconTrendUp    },
  { id: 'Product Manager',           Icon: IconLayout     },
  { id: 'UI/UX Designer',            Icon: IconPen        },
  { id: 'QA Engineer',               Icon: IconSearch     },
  { id: 'Cybersecurity Analyst',     Icon: IconShield     },
  { id: 'Business Analyst',          Icon: IconBriefcase2 },
  { id: 'Data Scientist',            Icon: IconFlask      },
  { id: 'SDE',                       Icon: IconGrid       },
  { id: 'System Architect',          Icon: IconServer     },
];

const CATEGORIES: Record<string, CatItem> = {
  faang:      { label: 'FAANG+',           Icon: IconStar2,      companies: ['Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft'] },
  product:    { label: 'Product Based',    Icon: IconPackage,    companies: ['Atlassian', 'Salesforce', 'Adobe', 'Spotify', 'Uber', 'Airbnb'] },
  service:    { label: 'Service Based',    Icon: IconBuilding,   companies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'HCL'] },
  startup:    { label: 'Startup',          Icon: IconRocket,     companies: ['Razorpay', 'Zepto', 'Groww', 'Swiggy', 'Ola', 'CRED'] },
  government: { label: 'Government',       Icon: IconUniversity, companies: ['DRDO', 'ISRO', 'RBI', 'NIC', 'BSNL', 'ONGC'] },
  internship: { label: 'Internship',       Icon: IconAward2,     companies: ['Any Startup', 'SME', 'Remote', 'Off-Campus', 'Internshala'] },
  campus:     { label: 'Campus Placement', Icon: IconGraduate,   companies: ['Tier 1 College', 'Tier 2 College', 'NIT', 'IIT', 'General Campus'] },
};

interface DiffItem { id: string; Icon: React.FC<any>; color: string; label: string; desc: string; }
const DIFFICULTIES: DiffItem[] = [
  { id: 'easy',   Icon: IconGrid,   color: 'var(--success)', label: 'Easy',   desc: 'Basic concepts, freshers' },
  { id: 'medium', Icon: IconTarget, color: 'var(--warning)', label: 'Medium', desc: 'Intermediate, 1-3 yrs exp' },
  { id: 'hard',   Icon: IconServer, color: 'var(--danger)',  label: 'Hard',   desc: 'Advanced, senior level' },
];

// inline import for circular reference workaround
import { IconTarget } from '@/lib/icons';

const STEPS = ['Mode', 'Role', 'Company', 'Difficulty', 'Options'];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [config, setConfig]   = useState({ mode: '', role: '', companyCategory: '', company: '', difficulty: '', inputMode: 'text', jobDescription: '' });
  const [starting, setStarting] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const jd = localStorage.getItem('jdContext');
    if (jd) { setConfig(c => ({ ...c, jobDescription: jd })); localStorage.removeItem('jdContext'); }
  }, []);

  const set = (key: string, value: string) => setConfig(c => ({ ...c, [key]: value }));

  const canNext = () => {
    if (step === 0) return !!config.mode;
    if (step === 1) return !!config.role;
    if (step === 2) return !!config.companyCategory && !!config.company;
    if (step === 3) return !!config.difficulty;
    return true;
  };

  const handleStart = async () => {
    setStarting(true); setError('');
    try {
      const res = await api.post<{ success: boolean; data: { _id: string } }>('/api/interview/start', config);
      router.push(`/interview/session/${res.data._id}`);
    } catch (err: any) { setError(err.message); setStarting(false); }
  };

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <span style={{ display: 'flex', color: 'var(--primary)' }}><IconMicrophone size={24} color="var(--primary)" /></span>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.1rem' }}>Interview Setup</h1>
          <p className="text-secondary text-sm">Customize your mock interview session</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="steps" style={{ marginBottom: '2.5rem' }}>
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
            <div className="step-dot">
              {i < step
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : i + 1}
            </div>
            <span className="text-sm" style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Step 0: Mode */}
      {step === 0 && (
        <div className="animate-fade-in-up">
          <h3 style={{ marginBottom: '1rem' }}>Select Interview Mode</h3>
          <div className="selector-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {MODES.map(m => (
              <div key={m.id} id={`mode-${m.id}`} className={`selector-item ${config.mode === m.id ? 'selected' : ''}`} onClick={() => set('mode', m.id)}>
                <div className="selector-item-icon">
                  <m.Icon size={28} color={config.mode === m.id ? 'var(--primary)' : 'var(--text-muted)'} />
                </div>
                <div style={{ fontWeight: 700 }}>{m.label}</div>
                <div className="text-xs text-muted">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Role */}
      {step === 1 && (
        <div className="animate-fade-in-up">
          <h3 style={{ marginBottom: '1rem' }}>Select Your Role</h3>
          <div className="selector-grid">
            {ROLES.map(r => (
              <div key={r.id} id={`role-${r.id.replace(/\s+/g,'-').toLowerCase()}`} className={`selector-item ${config.role === r.id ? 'selected' : ''}`} onClick={() => set('role', r.id)}>
                <div className="selector-item-icon">
                  <r.Icon size={26} color={config.role === r.id ? 'var(--primary)' : 'var(--text-muted)'} />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Company Category → Company */}
      {step === 2 && (
        <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Company Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(CATEGORIES).map(([id, cat]) => (
                <div key={id} id={`cat-${id}`} className={`selector-item ${config.companyCategory === id ? 'selected' : ''}`} style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => { set('companyCategory', id); set('company', ''); }}>
                  <cat.Icon size={18} color={config.companyCategory === id ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {config.companyCategory && (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Select Company</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CATEGORIES[config.companyCategory].companies.map(c => (
                  <div key={c} id={`company-${c.replace(/\s+/g,'-').toLowerCase()}`} className={`selector-item ${config.company === c ? 'selected' : ''}`} style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => set('company', c)}>
                    <span style={{ display: 'flex', color: config.company === c ? 'var(--primary)' : 'var(--text-muted)' }}>
                      <IconBuilding size={16} color="currentColor" />
                    </span>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Difficulty */}
      {step === 3 && (
        <div className="animate-fade-in-up">
          <h3 style={{ marginBottom: '1rem' }}>Select Difficulty</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '600px' }}>
            {DIFFICULTIES.map(d => (
              <div key={d.id} id={`diff-${d.id}`} className={`selector-item ${config.difficulty === d.id ? 'selected' : ''}`} onClick={() => set('difficulty', d.id)} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <d.Icon size={32} color={config.difficulty === d.id ? d.color : 'var(--text-muted)'} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{d.label}</div>
                <div className="text-xs text-muted">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Options */}
      {step === 4 && (
        <div className="animate-fade-in-up" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Input Mode</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { id: 'text',  Icon: IconType,   label: 'Text Mode',  desc: 'Type your answers'  },
                { id: 'voice', Icon: IconVolume,  label: 'Voice Mode', desc: 'Speak your answers' },
              ].map(m => (
                <div key={m.id} id={`input-${m.id}`} className={`selector-item ${config.inputMode === m.id ? 'selected' : ''}`} onClick={() => set('inputMode', m.id)} style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <m.Icon size={32} color={config.inputMode === m.id ? 'var(--primary)' : 'var(--text-muted)'} />
                  </div>
                  <div style={{ fontWeight: 700 }}>{m.label}</div>
                  <div className="text-xs text-muted">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Job Description (Optional)</h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '0.75rem' }}>Paste a JD to get hyper-personalized questions tailored to that role</p>
            <textarea id="setup-jd" className="textarea" placeholder="Paste job description here..." value={config.jobDescription} onChange={e => set('jobDescription', e.target.value)} style={{ minHeight: '140px' }} />
          </div>

          {/* Summary */}
          <div className="glass" style={{ padding: '1.25rem' }}>
            <div className="text-sm font-semibold text-muted" style={{ marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interview Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                ['Mode', MODES.find(m => m.id === config.mode)?.label],
                ['Role', config.role],
                ['Company', config.company],
                ['Difficulty', config.difficulty],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="text-sm text-muted">{k}:</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} style={{ visibility: step === 0 ? 'hidden' : 'visible', gap: '0.375rem' }}>
          <IconArrowLeft size={16} /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button id="setup-next" className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ gap: '0.375rem' }}>
            Next <IconArrowRight size={16} />
          </button>
        ) : (
          <button id="start-interview-btn" className="btn btn-primary btn-lg" onClick={handleStart} disabled={starting} style={{ gap: '0.5rem' }}>
            {starting
              ? <><IconLoader size={16} /> Starting...</>
              : <><IconMicrophone size={16} /> Start Interview</>}
          </button>
        )}
      </div>
    </div>
  );
}
