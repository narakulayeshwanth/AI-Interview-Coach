'use client';
import { useState } from 'react';
import { IconDollarSign, IconLoader, IconArrowRight, IconBarChart2, IconLightbulb } from '@/lib/icons';


const ROLES = [
  { id: 'Frontend Developer', baseLPA: 12 },
  { id: 'Backend Developer', baseLPA: 14 },
  { id: 'Full Stack Developer', baseLPA: 15 },
  { id: 'Machine Learning Engineer', baseLPA: 18 },
  { id: 'DevOps Engineer', baseLPA: 13 },
  { id: 'UI/UX Designer', baseLPA: 11 },
  { id: 'QA Engineer', baseLPA: 8 },
  { id: 'Product Manager', baseLPA: 18 },
  { id: 'Data Analyst', baseLPA: 9 }
];

const EXP_MULTIPLIERS = {
  fresher: 1.0,
  junior: 1.4,
  mid: 2.2,
  senior: 3.5
};

const COMPANY_MULTIPLIERS = {
  faang: 2.5,
  product: 1.8,
  service: 0.6,
  startup: 1.3
};

const LOCATION_MULTIPLIERS = {
  bangalore: 1.2,
  hyderabad: 1.0,
  mumbai_pune: 1.1,
  delhi: 0.95,
  remote_us: 2.8
};

export default function SalaryPage() {
  const [form, setForm] = useState({ role: 'Full Stack Developer', exp: 'junior', companyCat: 'product', location: 'bangalore' });
  const [predicted, setPredicted] = useState<{ avg: number; min: number; max: number; base: number; bonus: number; stocks: number } | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    
    setTimeout(() => {
      const selectedRole = ROLES.find(r => r.id === form.role) || ROLES[2];
      const baseSalary = selectedRole.baseLPA;
      
      const expMult = EXP_MULTIPLIERS[form.exp as keyof typeof EXP_MULTIPLIERS];
      const compMult = COMPANY_MULTIPLIERS[form.companyCat as keyof typeof COMPANY_MULTIPLIERS];
      const locMult = LOCATION_MULTIPLIERS[form.location as keyof typeof LOCATION_MULTIPLIERS];
      
      const avgSalaryLPA = Math.round(baseSalary * expMult * compMult * locMult);
      
      // Breakdown calculation
      let stockPercent = 0.1;
      let bonusPercent = 0.12;
      
      if (form.companyCat === 'faang') {
        stockPercent = 0.35;
        bonusPercent = 0.15;
      } else if (form.companyCat === 'startup') {
        stockPercent = 0.25;
        bonusPercent = 0.1;
      } else if (form.companyCat === 'service') {
        stockPercent = 0.0;
        bonusPercent = 0.08;
      }
      
      const stocksLPA = Math.round(avgSalaryLPA * stockPercent);
      const bonusLPA = Math.round(avgSalaryLPA * bonusPercent);
      const baseLPA = avgSalaryLPA - stocksLPA - bonusLPA;
      
      setPredicted({
        avg: avgSalaryLPA,
        min: Math.round(avgSalaryLPA * 0.85),
        max: Math.round(avgSalaryLPA * 1.25),
        base: baseLPA,
        bonus: bonusLPA,
        stocks: stocksLPA
      });
      setCalculating(false);
    }, 600);
  };

  return (
    <div className="page-inner animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ display: 'flex', color: 'var(--primary)' }}><IconDollarSign size={26} color="var(--primary)" /></span>
          Salary Predictor
        </h1>
        <p className="text-secondary text-sm">Estimate target CTC packages and equity breakdowns based on role, location, and experience</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Inputs */}
        <form onSubmit={handlePredict} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Job Role</label>
            <select className="select input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Experience Level</label>
            <select className="select input" value={form.exp} onChange={e => setForm(f => ({ ...f, exp: e.target.value }))}>
              <option value="fresher">Fresher (0 yrs)</option>
              <option value="junior">Junior (1-2 yrs)</option>
              <option value="mid">Mid-Level (3-5 yrs)</option>
              <option value="senior">Senior (5+ yrs)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Company Tier</label>
            <select className="select input" value={form.companyCat} onChange={e => setForm(f => ({ ...f, companyCat: e.target.value }))}>
              <option value="faang">FAANG & Top Product (Tier-1)</option>
              <option value="product">Product-based Companies (Tier-2)</option>
              <option value="startup">Growth Startups</option>
              <option value="service">IT Services Companies</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <select className="select input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
              <option value="bangalore">Bangalore (Tech Hub)</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="mumbai_pune">Mumbai / Pune</option>
              <option value="delhi">Delhi NCR</option>
              <option value="remote_us">US Remote (USD equivalent)</option>
            </select>
          </div>

          <button id="salary-calc-btn" type="submit" className="btn btn-primary w-full" disabled={calculating} style={{ gap: '0.375rem' }}>
            {calculating
              ? <><IconLoader size={15} color="currentColor" /> Estimating Salary...</>
              : <><IconDollarSign size={15} color="currentColor" /> Predict Salary Range <IconArrowRight size={15} color="currentColor" /></>}
          </button>
        </form>

        {/* Right Output */}
        <div>
          {predicted ? (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Primary Predict Result */}
              <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', textAlign: 'left' }}>
                  Estimated CTC Package
                </div>
                <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>
                  {form.location === 'remote_us' ? `$${Math.round(predicted.avg * 1.25)}K` : `${predicted.avg} LPA`}
                </div>
                <div className="text-sm text-secondary" style={{ marginTop: '0.5rem' }}>
                  Range: {form.location === 'remote_us' ? `$${Math.round(predicted.min * 1.25)}K - $${Math.round(predicted.max * 1.25)}K` : `${predicted.min} LPA - ${predicted.max} LPA`}
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="glass" style={{ padding: '1.5rem' }}>
                <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <IconBarChart2 size={14} color="var(--primary)" /> Component Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Base Pay', value: predicted.base, pct: Math.round((predicted.base / predicted.avg) * 100), color: 'var(--primary-light)' },
                    { label: 'Performance Bonus', value: predicted.bonus, pct: Math.round((predicted.bonus / predicted.avg) * 100), color: 'var(--accent)' },
                    { label: 'Stocks / RSUs (per yr)', value: predicted.stocks, pct: Math.round((predicted.stocks / predicted.avg) * 100), color: 'var(--warning)' }
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 600 }}>{c.label} ({c.pct}%)</span>
                        <span style={{ fontWeight: 700, color: c.color }}>
                          {form.location === 'remote_us' ? `$${Math.round(c.value * 1.25)}K` : `${c.value} LPA`}
                        </span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${c.pct}%`, background: c.color }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negotiation Tips */}
              <div className="glass" style={{ padding: '1.25rem' }}>
                <div className="text-sm font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <IconLightbulb size={14} color="var(--accent)" /> Negotiation Tips for {form.role}
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                  <li className="text-secondary">Avoid giving a single number. Refer to the predicted range: <strong>{predicted.min} - {predicted.max} LPA</strong>.</li>
                  <li className="text-secondary">Anchor negotiations around your stock components, especially at FAANG or growth-stage startups.</li>
                  <li className="text-secondary">Use written competing offers to trigger package matches and fast-track sign-on bonuses.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="glass" style={{ padding: '4rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
              <IconDollarSign size={48} color="var(--border)" />
              <p className="text-sm text-center">Enter your target details and click Predict to view detailed market value CTC breakdowns.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
