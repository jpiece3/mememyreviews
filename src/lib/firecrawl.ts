const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

interface ScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const response = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl error: ${response.status} ${error}`);
  }

  return response.json();
}

export function extractReviewsFromMarkdown(markdown: string): Array<{
  author: string;
  rating: number;
  body: string;
}> {
  // Extract review-like patterns from scraped markdown
  // This is a best-effort extraction — Claude will refine the results
  const reviews: Array<{ author: string; rating: number; body: string }> = [];
  const lines = markdown.split('\n');

  let currentReview: { author: string; rating: number; body: string } | null = null;

  for (const line of lines) {
    // Look for star ratings (common patterns)
    const starMatch = line.match(/(\d)\s*(?:out of 5|\/5|stars?|★)/i);
    if (starMatch) {
      if (currentReview && currentReview.body) {
        reviews.push(currentReview);
      }
      currentReview = {
        author: 'Anonymous',
        rating: parseInt(starMatch[1]),
        body: '',
      };
      continue;
    }

    // Accumulate body text
    if (currentReview && line.trim()) {
      currentReview.body += (currentReview.body ? ' ' : '') + line.trim();
    }
  }

  if (currentReview && currentReview.body) {
    reviews.push(currentReview);
  }

  return reviews;
}
