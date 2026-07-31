import { AuthProvider } from '@/lib/auth-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {children}
      </div>
    </AuthProvider>
  );
}
