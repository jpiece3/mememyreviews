import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface Subscription {
  plan: 'starter' | 'growth' | 'agency';
  status: string;
  currentPeriodEnd: string;
}

const PLAN_LIMITS = {
  starter: { imageMemes: 5, videoMemes: 0, reviewSources: 1, brands: 1, canEdit: false },
  growth: { imageMemes: 5, videoMemes: 2, reviewSources: 3, brands: 1, canEdit: true },
  agency: { imageMemes: 35, videoMemes: 14, reviewSources: 5, brands: 5, canEdit: true },
} as const;

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchSubscription() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        setSubscription({
          plan: data.plan,
          status: data.status,
          currentPeriodEnd: data.current_period_end,
        });
      }
      setLoading(false);
    }

    fetchSubscription();
  }, [user]);

  const limits = subscription ? PLAN_LIMITS[subscription.plan] : null;
  const isActive = subscription?.status === 'active';

  return { subscription, limits, isActive, loading };
}
