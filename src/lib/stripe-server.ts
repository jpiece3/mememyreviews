import Stripe from 'stripe';

let stripe: Stripe;

export function getStripe() {
  if (!stripe) {
    stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export const PRICE_IDS = {
  starter: '', // Fill in from Stripe Dashboard
  growth: '',
  agency: '',
} as const;

export type PlanName = keyof typeof PRICE_IDS;

export const PLAN_LIMITS = {
  starter: {
    imageMemes: 5,
    videoMemes: 0,
    reviewSources: 1,
    brands: 1,
    canEdit: false,
  },
  growth: {
    imageMemes: 5,
    videoMemes: 2,
    reviewSources: 3,
    brands: 1,
    canEdit: true,
  },
  agency: {
    imageMemes: 35,
    videoMemes: 14,
    reviewSources: 5,
    brands: 5,
    canEdit: true,
  },
} as const;
