const MEMELORD_BASE = 'https://api.memelordai.com/v1';

interface MemeGenerateResult {
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  templateName?: string;
}

export async function generateMeme(opts: {
  topText: string;
  bottomText: string;
  category?: string;
  style?: 'image' | 'video';
}): Promise<MemeGenerateResult> {
  const response = await fetch(`${MEMELORD_BASE}/ai-meme`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.MEMELORD_API_KEY}`,
    },
    body: JSON.stringify({
      top_text: opts.topText,
      bottom_text: opts.bottomText,
      category: opts.category || 'trending',
      style: opts.style || 'image',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Memelord error: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    success: true,
    imageUrl: data.image_url || data.url,
    videoUrl: data.video_url,
    templateName: data.template_name || data.template,
  };
}

export async function editMeme(opts: {
  memeId: string;
  topText: string;
  bottomText: string;
}): Promise<MemeGenerateResult> {
  const response = await fetch(`${MEMELORD_BASE}/ai-meme/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.MEMELORD_API_KEY}`,
    },
    body: JSON.stringify({
      meme_id: opts.memeId,
      top_text: opts.topText,
      bottom_text: opts.bottomText,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Memelord edit error: ${response.status} ${error}`);
  }

  const data = await response.json();

  return {
    success: true,
    imageUrl: data.image_url || data.url,
    videoUrl: data.video_url,
    templateName: data.template_name || data.template,
  };
}
