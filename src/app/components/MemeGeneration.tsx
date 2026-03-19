import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';

interface Props {
  packId: string;
}

export function MemeGeneration({ packId }: Props) {
  const { memes, setMemes, generationProgress, setGenerationProgress } = useAppStore();
  const [totalExpected, setTotalExpected] = useState(8);
  const [activeCaption, setActiveCaption] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!packId) return;

    // Poll for memes appearing in the pack
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('memes')
        .select('*')
        .eq('pack_id', packId)
        .order('created_at', { ascending: true });

      if (data) {
        const mapped = data.map((m: any) => ({
          id: m.id,
          reviewId: m.review_id,
          imageUrl: m.image_url,
          videoUrl: m.video_url,
          topText: m.meme_text_top,
          bottomText: m.meme_text_bottom,
          captionLinkedin: m.caption_linkedin,
          captionInstagram: m.caption_instagram,
          captionTiktok: m.caption_tiktok,
          templateName: m.template_name,
        }));
        setMemes(mapped);
        setGenerationProgress(mapped.length / totalExpected);

        // Check if pack is complete
        if (mapped.length >= totalExpected) {
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [packId]);

  const getCaptionPlatform = (memeId: string) => activeCaption[memeId] || 'instagram';

  const setCaptionPlatform = (memeId: string, platform: string) => {
    setActiveCaption((prev) => ({ ...prev, [memeId]: platform }));
  };

  const getCaption = (meme: typeof memes[0], platform: string) => {
    switch (platform) {
      case 'linkedin': return meme.captionLinkedin;
      case 'tiktok': return meme.captionTiktok;
      default: return meme.captionInstagram;
    }
  };

  const copyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isComplete = memes.length >= totalExpected;

  return (
    <div>
      <div className="app-topbar">
        <div>
          <div className="section-label">// Meme generation</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 42px)' }}>
            {isComplete ? 'YOUR MEMES ARE READY' : 'CONSULTING THE MEME GODS...'}
          </h2>
        </div>
        {isComplete && (
          <a href={`/app/export/${packId}`} className="app-btn app-btn-primary">
            Export Pack →
          </a>
        )}
      </div>

      {/* Progress bar */}
      {!isComplete && (
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${generationProgress * 100}%` }}
          />
        </div>
      )}

      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '24px', fontFamily: 'var(--font-mono)' }}>
        {memes.length} / {totalExpected} memes generated
      </div>

      {/* Meme grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {memes.map((meme) => (
          <div key={meme.id} className="meme-card" style={{ animation: 'fadeUp 0.4s ease both' }}>
            {meme.imageUrl ? (
              <img src={meme.imageUrl} alt="Generated meme" className="meme-card-image" />
            ) : (
              <div className="meme-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', textAlign: 'center' }}>
                  {meme.topText}
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', textAlign: 'center', marginTop: '12px' }}>
                  {meme.bottomText}
                </div>
              </div>
            )}
            <div className="meme-card-body">
              <div className="meme-card-actions" style={{ marginBottom: '12px' }}>
                <button className="meme-card-btn">🔄 Redo</button>
                <button className="meme-card-btn">✏️ Edit</button>
                {meme.imageUrl && (
                  <a
                    href={meme.imageUrl}
                    download
                    className="meme-card-btn primary"
                    style={{ textDecoration: 'none' }}
                  >
                    💾 Save
                  </a>
                )}
              </div>

              {/* Caption tabs */}
              <div className="caption-tabs">
                {['instagram', 'linkedin', 'tiktok'].map((platform) => (
                  <button
                    key={platform}
                    className={`caption-tab ${getCaptionPlatform(meme.id) === platform ? 'active' : ''}`}
                    onClick={() => setCaptionPlatform(meme.id, platform)}
                  >
                    {platform === 'instagram' ? '📸 IG' : platform === 'linkedin' ? '💼 LI' : '🎵 TT'}
                  </button>
                ))}
              </div>
              <div className="caption-text">
                {getCaption(meme, getCaptionPlatform(meme.id)) || 'Caption generating...'}
              </div>
              <button
                className="meme-card-btn"
                style={{ marginTop: '8px', width: '100%' }}
                onClick={() => copyCaption(getCaption(meme, getCaptionPlatform(meme.id)) || '')}
              >
                📋 Copy caption
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
