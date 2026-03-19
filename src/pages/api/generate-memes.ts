import type { APIRoute } from 'astro';
import { getUserClient, getAccessToken } from '../../lib/supabase-server';
import { generateMemeContent } from '../../lib/claude';
import { generateMeme } from '../../lib/memelord';

export const POST: APIRoute = async ({ request }) => {
  const token = getAccessToken(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = getUserClient(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { brandId, reviewIds } = body;

  // Get brand info for vibe
  const { data: brand } = await supabase
    .from('brands')
    .select('brand_vibe, meme_style')
    .eq('id', brandId)
    .single();

  if (!brand) {
    return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 });
  }

  // Get selected reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, body, rating')
    .in('id', reviewIds);

  if (!reviews || reviews.length === 0) {
    return new Response(JSON.stringify({ error: 'No reviews selected' }), { status: 400 });
  }

  // Create meme pack
  const { data: pack } = await supabase
    .from('meme_packs')
    .insert({
      brand_id: brandId,
      status: 'generating',
      meme_count: reviews.length,
    })
    .select()
    .single();

  if (!pack) {
    return new Response(JSON.stringify({ error: 'Failed to create pack' }), { status: 500 });
  }

  // Generate memes in parallel (don't await — return packId immediately)
  // The client polls for results
  generateMemesAsync(supabase, pack.id, reviews, brand.brand_vibe, brand.meme_style);

  return new Response(
    JSON.stringify({ packId: pack.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

async function generateMemesAsync(
  supabase: any,
  packId: string,
  reviews: any[],
  brandVibe: string,
  memeStyle: string
) {
  const promises = reviews.map(async (review: any) => {
    try {
      // 1. Generate meme text + captions with Claude
      const content = await generateMemeContent(review.body, brandVibe);

      // 2. Generate meme image/video with Memelord
      const memeResult = await generateMeme({
        topText: content.topText,
        bottomText: content.bottomText,
        category: 'trending',
        style: memeStyle === 'video' ? 'video' : 'image',
      });

      // 3. Insert meme record
      await supabase.from('memes').insert({
        pack_id: packId,
        review_id: review.id,
        image_url: memeResult.imageUrl,
        video_url: memeResult.videoUrl,
        meme_text_top: content.topText,
        meme_text_bottom: content.bottomText,
        caption_linkedin: content.captionLinkedin,
        caption_instagram: content.captionInstagram,
        caption_tiktok: content.captionTiktok,
        template_name: memeResult.templateName,
      });
    } catch (err) {
      console.error(`Failed to generate meme for review ${review.id}:`, err);
    }
  });

  await Promise.allSettled(promises);

  // Update pack status
  await supabase
    .from('meme_packs')
    .update({ status: 'complete' })
    .eq('id', packId);
}
