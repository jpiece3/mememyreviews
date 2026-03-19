import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';

interface Props {
  brandId: string;
  onGenerate: () => void;
}

export function ReviewDiscovery({ brandId, onGenerate }: Props) {
  const { session } = useAuth();
  const { reviews, setReviews, toggleReviewSelection } = useAppStore();
  const [scrapeStatus, setScrapeStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) return;

    setScrapeStatus(['🔍 Scanning your store...']);

    // Poll for reviews from Supabase
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('brand_id', brandId)
        .order('memeability_score', { ascending: false });

      if (data && data.length > 0) {
        setScrapeStatus((prev) => {
          const msgs = [...prev];
          if (!msgs.includes(`✅ Found ${data.length} reviews`)) {
            msgs.push(`✅ Found ${data.length} reviews`);
            msgs.push('⭐ Filtering 4-5 star reviews...');
            msgs.push('🧠 AI is scoring meme potential...');
          }
          return msgs;
        });

        const mapped = data.map((r: any) => ({
          id: r.id,
          body: r.body,
          rating: r.rating || 5,
          author: r.author || 'Anonymous',
          sourceType: r.source_id || 'manual',
          memeabilityScore: r.memeability_score || 50,
          selected: r.memeability_score >= 60, // Auto-select top reviews
        }));

        setReviews(mapped);
        setLoading(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [brandId]);

  const selectedCount = reviews.filter((r) => r.selected).length;

  const handleGenerate = async () => {
    const selectedIds = reviews.filter((r) => r.selected).map((r) => r.id);

    const response = await fetch('/api/generate-memes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ brandId, reviewIds: selectedIds }),
    });

    const data = await response.json();
    if (data.packId) {
      useAppStore.getState().setCurrentPackId(data.packId);
      onGenerate();
    }
  };

  const getMemeabilityClass = (score: number) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div>
      <div className="app-topbar">
        <div>
          <div className="section-label">// Review discovery</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 42px)' }}>YOUR BEST REVIEWS</h2>
        </div>
        <button
          className="app-btn app-btn-primary"
          onClick={handleGenerate}
          disabled={selectedCount === 0}
        >
          Generate {selectedCount} Memes →
        </button>
      </div>

      {/* Scrape feed */}
      {loading && (
        <div className="scrape-feed">
          {scrapeStatus.map((line, i) => (
            <div key={i} className="scrape-feed-line" style={{ animationDelay: `${i * 0.3}s` }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Review cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`review-card ${review.selected ? 'selected' : ''}`}
            onClick={() => toggleReviewSelection(review.id)}
          >
            <div className="review-card-checkbox">
              {review.selected && '✓'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#fbbf24' }}>
                  {'★'.repeat(review.rating)}
                </span>
                <span className={`memeability-badge ${getMemeabilityClass(review.memeabilityScore)}`}>
                  {Math.round(review.memeabilityScore)}% meme-able
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--black)', lineHeight: 1.5 }}>
                "{review.body}"
              </p>
              <span style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '4px', display: 'block' }}>
                — {review.author}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
