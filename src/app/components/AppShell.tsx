import type { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
import { useAuth } from '../hooks/useAuth';

interface AppShellProps {
  children: ReactNode;
  activePage?: string;
}

export function AppShell({ children, activePage }: AppShellProps) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/app' },
    { id: 'generate', label: 'Generate', icon: '🎭', href: '/app/onboarding' },
  ];

  return (
    <AuthGuard>
      <div className="app-container">
        <aside className="app-sidebar">
          <a href="/" className="app-sidebar-logo">
            Meme<span>My</span>Reviews
          </a>
          <nav className="app-sidebar-nav">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`app-sidebar-link ${activePage === item.id ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div style={{ marginTop: 'auto', padding: '0 12px' }}>
            <div style={{ fontSize: '12px', color: '#888', padding: '10px 12px', borderTop: '1px solid var(--border)', marginTop: '12px' }}>
              {user?.email}
            </div>
            <button
              onClick={signOut}
              className="app-sidebar-link"
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)' }}
            >
              <span>👋</span>
              Sign out
            </button>
          </div>
        </aside>
        <main className="app-main">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
