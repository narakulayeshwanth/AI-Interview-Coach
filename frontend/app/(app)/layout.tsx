'use client';
import { useState } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <div className={`app-layout ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {/* Sidebar toggle button (always visible in top-left) */}
        <button
          id="sidebar-toggle-btn"
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            /* X / close icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            /* Hamburger / open icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
