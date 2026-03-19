import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const REVIEW_SOURCES = [
  { id: 'amazon', label: 'Amazon', icon: '📦' },
  { id: 'shopify', label: 'Shopify', icon: '🛍️' },
  { id: 'g2', label: 'G2', icon: '⭐' },
  { id: 'trustpilot', label: 'Trustpilot', icon: '✅' },
  { id: 'manual', label: 'Paste manually', icon: '📋' },
];

const BRAND_VIBES = [
  { id: 'funny', label: 'Funny & Unhinged', icon: '😂', desc: 'Max humor, screenshot-worthy' },
  { id: 'cool', label: 'Cool & Dry', icon: '😎', desc: 'Subtle, understated, clever' },
  { id: 'bold', label: 'Bold & Hype', icon: '🔥', desc: 'High-energy, influencer vibes' },
];

const MEME_STYLES = [
  { id: 'image', label: 'Image memes', icon: '🖼️', desc: 'Classic meme images' },
  { id: 'video', label: 'Video memes', icon: '🎬', desc: 'Short video formats' },
  { id: 'mix', label: 'Mix of both', icon: '🎭', desc: 'Best of both worlds' },
];

export function OnboardingScreen() {
  const { session } = useAuth();
  const [brandName, setBrandName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sourceUrls, setSourceUrls] = useState<Record<string, string>>({});
  const [manualReviews, setManualReviews] = useState('');
  const [brandVibe, setBrandVibe] = useState('funny');
  const [memeStyle, setMemeStyle] = useState('mix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || selectedSources.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/scrape-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          brandName,
          productUrl,
          reviewSources: selectedSources.map((id) => ({
            type: id,
            url: sourceUrls[id] || '',
          })),
          manualReviews: selectedSources.includes('manual') ? manualReviews : undefined,
          brandVibe,
          memeStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start review scraping');
      }

      window.location.href = `/app/generate?brandId=${data.brandId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="app-topbar" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div>
          <div className="section-label">// New meme pack</div>
          <h2 style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}>SET UP YOUR BRAND</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Brand name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Barkwell Pet Co."
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Product / store URL</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://yourstore.com"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Where are your reviews?</label>
          <div className="chip-group">
            {REVIEW_SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                className={`chip ${selectedSources.includes(source.id) ? 'selected' : ''}`}
                onClick={() => toggleSource(source.id)}
              >
                <span>{source.icon}</span>
                {source.label}
              </button>
            ))}
          </div>
        </div>

        {selectedSources.filter((s) => s !== 'manual').map((sourceId) => (
          <div className="form-group" key={sourceId}>
            <label className="form-label">{REVIEW_SOURCES.find((s) => s.id === sourceId)?.label} URL</label>
            <input
              type="url"
              className="form-input"
              placeholder={`Paste your ${sourceId} listing URL`}
              value={sourceUrls[sourceId] || ''}
              onChange={(e) => setSourceUrls((prev) => ({ ...prev, [sourceId]: e.target.value }))}
            />
          </div>
        ))}

        {selectedSources.includes('manual') && (
          <div className="form-group">
            <label className="form-label">Paste your reviews (one per line)</label>
            <textarea
              className="form-input"
              rows={6}
              placeholder={"5 stars - This product changed my life...\n4 stars - Pretty good but..."}
              value={manualReviews}
              onChange={(e) => setManualReviews(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Brand vibe</label>
          <div className="radio-cards">
            {BRAND_VIBES.map((vibe) => (
              <div
                key={vibe.id}
                className={`radio-card ${brandVibe === vibe.id ? 'selected' : ''}`}
                onClick={() => setBrandVibe(vibe.id)}
              >
                <div className="radio-card-icon">{vibe.icon}</div>
                <div className="radio-card-label">{vibe.label}</div>
                <div className="radio-card-desc">{vibe.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Meme style</label>
          <div className="radio-cards">
            {MEME_STYLES.map((style) => (
              <div
                key={style.id}
                className={`radio-card ${memeStyle === style.id ? 'selected' : ''}`}
                onClick={() => setMemeStyle(style.id)}
              >
                <div className="radio-card-icon">{style.icon}</div>
                <div className="radio-card-label">{style.label}</div>
                <div className="radio-card-desc">{style.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        <button
          type="submit"
          className="app-btn app-btn-primary"
          style={{ width: '100%', marginTop: '8px' }}
          disabled={loading || !brandName || selectedSources.length === 0}
        >
          {loading ? 'Scanning reviews...' : 'Start Generating →'}
        </button>
      </form>
    </div>
  );
}
