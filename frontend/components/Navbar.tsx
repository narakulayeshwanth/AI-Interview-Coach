'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#testimonials', label: 'Testimonials' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">
          <span>AI Interview</span> Coach
        </Link>

        <div className="navbar-links">
          {isLanding && NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="navbar-link">{l.label}</a>
          ))}
          <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </div>
    </nav>
  );
}
