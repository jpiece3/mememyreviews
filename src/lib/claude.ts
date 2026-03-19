import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: import.meta.env.ANTHROPIC_API_KEY });
  }
  return client;
}

interface ReviewWithScore {
  id: string;
  body: string;
  rating: number;
  memeabilityScore: number;
  memeabilityReason: string;
}

export async function scoreReviews(
  reviews: Array<{ id: string; body: string; rating: number }>
): Promise<ReviewWithScore[]> {
  const anthropic = getClient();

  const reviewList = reviews
    .map((r, i) => `[${i}] (${r.rating}★) "${r.body}"`)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Score these customer reviews for meme potential on a scale of 0-100. A great meme review is funny, relatable, quotable, or has unexpected humor. Return JSON only — an array of objects with index, score, and a short reason.

Reviews:
${reviewList}

Return format: [{"index": 0, "score": 85, "reason": "Self-deprecating humor about jealousy"}, ...]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const scores: Array<{ index: number; score: number; reason: string }> = JSON.parse(content.text);

  return reviews.map((review, i) => {
    const scoreData = scores.find((s) => s.index === i);
    return {
      ...review,
      memeabilityScore: scoreData?.score ?? 50,
      memeabilityReason: scoreData?.reason ?? 'Average potential',
    };
  });
}

interface MemeContent {
  topText: string;
  bottomText: string;
  captionLinkedin: string;
  captionInstagram: string;
  captionTiktok: string;
}

export async function generateMemeContent(
  review: string,
  brandVibe: string
): Promise<MemeContent> {
  const anthropic = getClient();

  const vibeInstructions = {
    funny: 'Make it hilarious and unhinged — the kind of meme people screenshot and send to their group chat.',
    cool: 'Keep it dry and understated — subtle humor, cool delivery, no try-hard energy.',
    bold: 'Make it bold, hype, and high-energy — like an influencer reaction post.',
  };

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Turn this customer review into meme content.

Review: "${review}"

Vibe: ${vibeInstructions[brandVibe as keyof typeof vibeInstructions] || vibeInstructions.funny}

Return JSON only:
{
  "topText": "Short top text for meme image",
  "bottomText": "Punchline bottom text",
  "captionLinkedin": "Professional but funny LinkedIn caption (2-3 sentences)",
  "captionInstagram": "Casual Instagram caption with relevant emojis",
  "captionTiktok": "Short TikTok caption with trending energy"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  return JSON.parse(content.text);
}
