import type { APIRoute } from 'astro';
import { getUserClient, getAccessToken } from '../../lib/supabase-server';

export const GET: APIRoute = async ({ request, url }) => {
  const token = getAccessToken(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = getUserClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const packId = url.searchParams.get('packId');
  if (!packId) {
    return new Response(JSON.stringify({ error: 'packId required' }), { status: 400 });
  }

  // Verify user owns this pack (through brand ownership)
  const { data: pack } = await supabase
    .from('meme_packs')
    .select('id, brands(user_id)')
    .eq('id', packId)
    .single();

  if (!pack || (pack as any).brands?.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Pack not found' }), { status: 404 });
  }

  // Fetch all memes
  const { data: memes } = await supabase
    .from('memes')
    .select('*')
    .eq('pack_id', packId)
    .order('created_at', { ascending: true });

  return new Response(
    JSON.stringify({
      memes: (memes || []).map((m: any) => ({
        id: m.id,
        imageUrl: m.image_url,
        videoUrl: m.video_url,
        topText: m.meme_text_top,
        bottomText: m.meme_text_bottom,
        captionLinkedin: m.caption_linkedin,
        captionInstagram: m.caption_instagram,
        captionTiktok: m.caption_tiktok,
      })),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
