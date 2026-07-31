import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  IconResume, IconTarget, IconMicrophone, IconVolume, IconBarChart2, IconRepeat,
  IconTrendingUp, IconFileText, IconUserCheck, IconTerminal, IconHeadphones,
  IconServer, IconGrid, IconMessageCircle, IconRocket, IconSpark,
} from '@/lib/icons';

type FeatureItem = { Icon: React.FC<any>; title: string; desc: string };
type ModeItem    = { Icon: React.FC<any>; label: string };

const FEATURES: FeatureItem[] = [
  { Icon: IconResume,      title: 'AI Resume Analyzer',    desc: 'Get ATS score, skill gap detection, grammar check, and actionable suggestions to land more interviews.' },
  { Icon: IconTarget,      title: 'JD Matching',           desc: 'Paste any job description — AI extracts required skills and tailors interview questions specifically to that role.' },
  { Icon: IconMicrophone,  title: 'AI Mock Interviews',    desc: '7 interview modes: HR, Technical, Behavioral, Managerial, System Design, and more with adaptive follow-ups.' },
  { Icon: IconVolume,      title: 'Voice Mode',            desc: 'Practice speaking out loud with voice input. AI reads questions aloud and transcribes your answers in real time.' },
  { Icon: IconBarChart2,   title: 'Deep Feedback',         desc: '6-dimension scoring: Grammar, Communication, Confidence, Technical Accuracy, STAR Method, and more per answer.' },
  { Icon: IconRepeat,      title: 'Interview Replay',      desc: 'Revisit every answer side-by-side with the ideal answer and understand exactly why it is better.' },
  { Icon: IconTrendingUp,  title: 'Performance Dashboard', desc: 'Skill radar, trend charts, readiness %, streak tracking — like LeetCode but for interviews.' },
  { Icon: IconFileText,    title: 'PDF Reports',           desc: 'Export beautiful interview reports with scores, weak areas, and a personalized improvement plan.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Your Resume',    desc: 'Drop your PDF or DOCX. AI analyzes it in seconds — ATS score, skill gaps, improvement tips.' },
  { step: '02', title: 'Set Up Your Interview', desc: 'Choose role, company category, difficulty, and interview mode. Optionally paste a job description for hyper-personalized questions.' },
  { step: '03', title: 'Practice with AI',      desc: 'Answer questions via text or voice. The AI adapts follow-up questions based on your responses, just like a real interviewer.' },
  { step: '04', title: 'Get Detailed Feedback', desc: 'Review scores across 6 dimensions per answer, read ideal answers, and export your full report as PDF.' },
];

const TESTIMONIALS = [
  { quote: 'I practiced for 2 weeks on AI Interview Coach and landed my Google SDE-2 offer. The per-answer feedback is insanely detailed — nothing else comes close.', name: 'Arjun Mehta',  role: 'SDE-2 @ Google',            initials: 'AM' },
  { quote: 'The JD Matching feature is genius. It generated questions straight from the Razorpay job posting and I got asked 4 of them in the actual interview!',         name: 'Priya Sharma', role: 'Product Manager @ Razorpay', initials: 'PS' },
  { quote: 'The interview replay showed me exactly how weak my STAR answers were. After fixing that, my confidence score jumped from 5 to 8.',                            name: 'Rahul Nair',   role: 'Backend Engineer @ Swiggy',  initials: 'RN' },
];

const MODES: ModeItem[] = [
  { Icon: IconUserCheck,     label: 'HR Interview'     },
  { Icon: IconTerminal,      label: 'Technical'        },
  { Icon: IconHeadphones,    label: 'Behavioral'       },
  { Icon: IconServer,        label: 'System Design'    },
  { Icon: IconGrid,          label: 'Managerial'       },
  { Icon: IconMessageCircle, label: 'Group Discussion' },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-eyebrow animate-fade-in-up">
            <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}><IconSpark size={16} color="currentColor" /></span>
            &nbsp;AI-Powered Interview Preparation
          </div>

          <h1 className="hero-title animate-fade-in-up delay-100">
            Practice Smarter.<br />
            <span className="gradient-text">Interview Better.</span><br />
            Land the Job.
          </h1>

          <p className="hero-subtitle animate-fade-in-up delay-200">
            The most complete AI interview prep platform — resume analysis, mock interviews,
            real-time feedback, voice mode, and detailed performance analytics. All in one place.
          </p>

          <div className="hero-cta animate-fade-in-up delay-300">
            <Link href="/auth/signup" className="btn btn-primary btn-lg animate-pulse-glow">
              Start Practicing Free →
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary btn-lg">
              See How It Works
            </Link>
          </div>

          {/* Mode pills */}
          <div className="animate-fade-in-up delay-400" style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {MODES.map((m) => (
              <div key={m.label} className="badge badge-muted" style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <m.Icon size={14} color="currentColor" /> {m.label}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up delay-500" style={{ marginTop: '4rem', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '50K+', label: 'Interviews Practiced' },
              { value: '18+',  label: 'Job Roles Covered'   },
              { value: '7',    label: 'Interview Modes'     },
              { value: '92%',  label: 'Success Rate'        },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Everything You Need</div>
            <h2>A Complete Interview OS</h2>
            <p style={{ marginTop: '1rem', maxWidth: '560px', margin: '1rem auto 0' }}>
              From resume to offer letter — every tool you need to prepare, practice, and perform.
            </p>
          </div>

          <div className="grid-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`glass feature-card animate-fade-in-up delay-${(i % 4) * 100}`}>
                <div className="feature-icon">
                  <f.Icon size={28} color="var(--primary)" />
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>{f.title}</h4>
                  <p className="text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="section" id="how-it-works" style={{ background: 'rgba(249,115,22,0.03)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Simple Process</div>
            <h2>From Resume to Readiness in 4 Steps</h2>
          </div>

          <div className="grid-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className={`glass feature-card animate-fade-in-up delay-${i * 100}`} style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900, background: 'var(--grad-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                  {item.step}
                </div>
                <h4>{item.title}</h4>
                <p className="text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="section" id="testimonials">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Real Results</div>
            <h2>Loved by Job Seekers</h2>
          </div>

          <div className="grid-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`glass testimonial-card animate-fade-in-up delay-${i * 100}`}>
                <div style={{ color: 'var(--warning)', fontSize: '0.85rem', letterSpacing: '3px', marginBottom: '0.75rem' }}>&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="glass" style={{ padding: '4rem', maxWidth: '700px', margin: '0 auto', background: 'var(--grad-card)', borderColor: 'rgba(249,115,22,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--primary-subtle)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconRocket size={32} color="var(--primary)" />
              </div>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Ready to Ace Your Next Interview?</h2>
            <p style={{ marginBottom: '2rem' }}>Join thousands of developers and professionals who use AI Interview Coach to prepare smarter and land their dream jobs.</p>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              Start for Free — No Credit Card →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <div className="container">
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="navbar-logo"><span className="gradient-text">AI Interview</span> Coach</span>
          </div>
          <p>Built with care as a portfolio project · &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
