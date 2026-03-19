import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Meme {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  topText: string;
  bottomText: string;
  captionLinkedin: string;
  captionInstagram: string;
  captionTiktok: string;
}

interface Props {
  packId: string;
}

export function ExportPack({ packId }: Props) {
  const { session } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchPack() {
      const response = await fetch(`/api/export-pack?packId=${packId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await response.json();
      if (data.memes) {
        setMemes(data.memes);
      }
      setLoading(false);
    }

    if (session) fetchPack();
  }, [packId, session]);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add captions file
      let captions = '';
      for (const meme of memes) {
        captions += `--- Meme: ${meme.topText} / ${meme.bottomText} ---\n`;
        captions += `LinkedIn: ${meme.captionLinkedin}\n`;
        captions += `Instagram: ${meme.captionInstagram}\n`;
        captions += `TikTok: ${meme.captionTiktok}\n\n`;
      }
      zip.file('captions.txt', captions);

      // Download and add images
      for (let i = 0; i < memes.length; i++) {
        const meme = memes[i];
        if (meme.imageUrl) {
          try {
            const response = await fetch(meme.imageUrl);
            const blob = await response.blob();
            zip.file(`meme-${i + 1}.jpg`, blob);
          } catch {
            // Skip failed downloads
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-pack-${packId.slice(0, 8)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP download failed:', err);
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div className="stat-label">Loading pack...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-topbar">
        <div>
          <div className="section-label">// Export pack</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 42px)' }}>YOUR MEME PACK</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Memes</div>
          <div className="stat-value">{memes.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Captions</div>
          <div className="stat-value">{memes.length * 3}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pack ID</div>
          <div className="stat-value" style={{ fontSize: '20px', fontFamily: 'var(--font-mono)' }}>
            {packId.slice(0, 8)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button
          className="app-btn app-btn-primary"
          onClick={handleDownloadZip}
          disabled={downloading}
        >
          {downloading ? 'Preparing ZIP...' : '📦 Download ZIP'}
        </button>
        <button className="app-btn app-btn-secondary" disabled style={{ opacity: 0.5 }}>
          📓 Push to Notion — Coming Soon
        </button>
        <button className="app-btn app-btn-secondary" disabled style={{ opacity: 0.5 }}>
          📅 Schedule Posts — Coming Soon
        </button>
      </div>

      {/* Meme previews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {memes.map((meme, i) => (
          <div key={meme.id} className="app-card" style={{ padding: '0', overflow: 'hidden' }}>
            {meme.imageUrl ? (
              <img src={meme.imageUrl} alt={`Meme ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '16px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', textAlign: 'center' }}>{meme.topText}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', textAlign: 'center', marginTop: '8px' }}>{meme.bottomText}</div>
              </div>
            )}
            <div style={{ padding: '12px' }}>
              {meme.imageUrl && (
                <a
                  href={meme.imageUrl}
                  download
                  className="meme-card-btn primary"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  💾 Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
