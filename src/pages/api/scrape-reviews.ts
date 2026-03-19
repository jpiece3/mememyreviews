import type { APIRoute } from 'astro';
import { getUserClient, getAccessToken } from '../../lib/supabase-server';
import { scrapeUrl, extractReviewsFromMarkdown } from '../../lib/firecrawl';
import { scoreReviews } from '../../lib/claude';

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
  const { brandName, productUrl, reviewSources, manualReviews, brandVibe, memeStyle } = body;

  // 1. Create brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      user_id: user.id,
      name: brandName,
      product_url: productUrl || null,
      brand_vibe: brandVibe,
      meme_style: memeStyle,
    })
    .select()
    .single();

  if (brandError) {
    return new Response(JSON.stringify({ error: brandError.message }), { status: 500 });
  }

  // 2. Create review sources
  for (const source of reviewSources) {
    await supabase.from('review_sources').insert({
      brand_id: brand.id,
      source_type: source.type,
      source_url: source.url || null,
    });
  }

  // 3. Scrape reviews from each source
  const allReviews: Array<{ author: string; rating: number; body: string; sourceId?: string }> = [];

  for (const source of reviewSources) {
    if (source.type === 'manual' && manualReviews) {
      // Parse manual reviews (one per line)
      const lines = manualReviews.split('\n').filter((l: string) => l.trim());
      for (const line of lines) {
        const ratingMatch = line.match(/^(\d)\s*(?:stars?\s*[-–—]?\s*)/i);
        allReviews.push({
          author: 'Manual entry',
          rating: ratingMatch ? parseInt(ratingMatch[1]) : 5,
          body: ratingMatch ? line.replace(ratingMatch[0], '').trim() : line.trim(),
        });
      }
    } else if (source.url) {
      try {
        const result = await scrapeUrl(source.url);
        if (result.success && result.data?.markdown) {
          const extracted = extractReviewsFromMarkdown(result.data.markdown);
          allReviews.push(...extracted);
        }
      } catch (err) {
        console.error(`Failed to scrape ${source.url}:`, err);
      }
    }
  }

  if (allReviews.length === 0) {
    return new Response(JSON.stringify({ error: 'No reviews found. Try pasting reviews manually.' }), { status: 400 });
  }

  // 4. Insert reviews into DB (without scores first)
  const { data: insertedReviews } = await supabase
    .from('reviews')
    .insert(
      allReviews.map((r) => ({
        brand_id: brand.id,
        author: r.author,
        rating: r.rating,
        body: r.body,
        memeability_score: 0,
      }))
    )
    .select();

  // 5. Score with Claude
  if (insertedReviews && insertedReviews.length > 0) {
    try {
      const scored = await scoreReviews(
        insertedReviews.map((r: any) => ({ id: r.id, body: r.body, rating: r.rating }))
      );

      // Update scores in DB
      for (const review of scored) {
        await supabase
          .from('reviews')
          .update({ memeability_score: review.memeabilityScore })
          .eq('id', review.id);
      }
    } catch (err) {
      console.error('Claude scoring failed:', err);
    }
  }

  return new Response(
    JSON.stringify({
      brandId: brand.id,
      reviewCount: allReviews.length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
