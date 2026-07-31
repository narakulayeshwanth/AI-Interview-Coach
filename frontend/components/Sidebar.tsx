'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import {
  IconDashboard, IconResume, IconMicrophone, IconHistory,
  IconBriefcase, IconBook, IconMail, IconDollar,
  IconTrophy, IconTarget, IconUser, IconLogOut,
} from '@/lib/icons';

type MenuItem =
  | { href: string; icon: React.ReactNode; label: string; section?: never }
  | { section: true; label: string; href?: never; icon?: never };

const MENU: MenuItem[] = [
  { href: '/dashboard',         icon: <IconDashboard />,  label: 'Dashboard' },
  { href: '/resume',            icon: <IconResume />,     label: 'Resume Analyzer' },
  { href: '/interview/setup',   icon: <IconMicrophone />, label: 'New Interview' },
  { href: '/interview/history', icon: <IconHistory />,    label: 'History' },
  { section: true,              label: 'AI Tools' },
  { href: '/career',            icon: <IconBriefcase />,  label: 'Career Coach' },
  { href: '/learning',          icon: <IconBook />,       label: 'Learning Hub' },
  { href: '/cover-letter',      icon: <IconMail />,       label: 'Cover Letter' },
  { href: '/salary',            icon: <IconDollar />,     label: 'Salary Predictor' },
  { section: true,              label: 'Community' },
  { href: '/leaderboard',       icon: <IconTrophy />,     label: 'Leaderboard' },
  { href: '/missions',          icon: <IconTarget />,     label: 'Daily Missions' },
  { section: true,              label: 'Account' },
  { href: '/profile',           icon: <IconUser />,       label: 'Profile' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo area */}
        <div className="sidebar-logo-area">
          <Link href="/dashboard" style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
            <div className="navbar-logo">
              <span className="gradient-text">AI Interview</span> Coach
            </div>
          </Link>

          {/* Close button (X) inside sidebar */}
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-thumb">
              {theme === 'dark'
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
            </span>
          </span>
          <span className="theme-toggle-label">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>

        {/* Navigation */}
        {MENU.map((item, i) =>
          item.section ? (
            <div key={i} style={{ padding: '0.875rem 1rem 0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {item.label}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', opacity: 0.85 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        )}

        <div style={{ marginTop: 'auto' }}>
          <div className="divider" />
          <button
            className="sidebar-item w-full"
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            onClick={handleLogout}
          >
            <span style={{ display: 'flex', alignItems: 'center', opacity: 0.85 }}><IconLogOut /></span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
