import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="stat-label">Loading...</div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
}
