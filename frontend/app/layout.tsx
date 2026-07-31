import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';

export const metadata: Metadata = {
  title: 'AI Interview Coach — Ace Your Next Interview',
  description:
    'AI-powered interview preparation platform. Upload your resume, practice role-specific mock interviews, get real-time AI feedback, and track your performance with detailed analytics.',
  keywords: 'interview preparation, AI mock interview, resume analyzer, job interview practice, technical interview',
  openGraph: {
    title: 'AI Interview Coach',
    description: 'Practice smarter. Interview better. Land the job.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
