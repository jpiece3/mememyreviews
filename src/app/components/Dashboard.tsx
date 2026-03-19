import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

interface MemePack {
  id: string;
  meme_count: number;
  status: string;
  created_at: string;
  brand_name?: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const { subscription, limits } = useSubscription();
  const [packs, setPacks] = useState<MemePack[]>([]);
  const [stats, setStats] = useState({ totalMemes: 0, totalPacks: 0, sourcesConnected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      // Fetch recent packs with brand names
      const { data: packsData } = await supabase
        .from('meme_packs')
        .select('id, meme_count, status, created_at, brands(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (packsData) {
        setPacks(
          packsData.map((p: any) => ({
            ...p,
            brand_name: p.brands?.name || 'Unknown',
          }))
        );
      }

      // Fetch stats
      const { count: memeCount } = await supabase
        .from('memes')
        .select('*', { count: 'exact', head: true });

      const { count: packCount } = await supabase
        .from('meme_packs')
        .select('*', { count: 'exact', head: true });

      const { count: sourceCount } = await supabase
        .from('review_sources')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalMemes: memeCount || 0,
        totalPacks: packCount || 0,
        sourcesConnected: sourceCount || 0,
      });

      setLoading(false);
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="stat-label">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-topbar">
        <div>
          <div className="section-label">// Dashboard</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 42px)' }}>YOUR MEME HQ</h2>
        </div>
        <a href="/app/onboarding" className="app-btn app-btn-primary">
          Generate New Pack →
        </a>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Meme Packs</div>
          <div className="stat-value">{stats.totalPacks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Memes</div>
          <div className="stat-value">{stats.totalMemes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sources</div>
          <div className="stat-value">{stats.sourcesConnected}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Plan</div>
          <div className="stat-value" style={{ fontSize: '28px', textTransform: 'uppercase' }}>
            {subscription?.plan || 'Free'}
          </div>
        </div>
      </div>

      {/* Recent packs */}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', marginBottom: '16px' }}>
        RECENT PACKS
      </h3>

      {packs.length === 0 ? (
        <div className="app-card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎭</div>
          <p style={{ fontSize: '15px', color: 'var(--gray)', marginBottom: '20px' }}>
            No meme packs yet. Generate your first one!
          </p>
          <a href="/app/onboarding" className="app-btn app-btn-primary">
            Get Started →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {packs.map((pack) => (
            <a
              key={pack.id}
              href={`/app/export/${pack.id}`}
              className="app-card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--black)' }}>
                  {pack.brand_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(pack.created_at).toLocaleDateString()} · {pack.meme_count} memes
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className={`memeability-badge ${pack.status === 'complete' ? 'high' : 'medium'}`}
                >
                  {pack.status}
                </span>
                <span style={{ color: 'var(--gray)' }}>→</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
