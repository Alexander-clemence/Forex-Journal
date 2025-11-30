'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getTier, TierInfo } from '@/lib/utils/subscription';
import { Database } from '@/lib/types/database';

type UserWithSubscription = Database['public']['Views']['profile_with_subscription']['Row'];

export function useSubscription() {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<UserWithSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadSubscription();
  }, [user?.id]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_with_subscription')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found, which is fine (free tier)
        console.error('Error loading subscription:', error);
      }

      setSubscriptionInfo(data || null);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const tierInfo: TierInfo = useMemo(() => {
    if (!subscriptionInfo) {
      return { tier: 'free', hasPremium: false };
    }
    
    // Use exact backend logic for isActive
    const isActive =
      subscriptionInfo.subscription_status === 'active' &&
      (!subscriptionInfo.subscription_ends_at ||
        new Date(subscriptionInfo.subscription_ends_at) > new Date());
    
    if (!isActive) {
      return { tier: 'free', hasPremium: false };
    }
    
    return getTier({
      plan_code: subscriptionInfo.plan_code,
      subscription_status: subscriptionInfo.subscription_status,
      subscription_ends_at: subscriptionInfo.subscription_ends_at || null,
    });
  }, [subscriptionInfo]);

  return {
    subscriptionInfo,
    tier: tierInfo.tier,
    hasPremium: tierInfo.hasPremium,
    loading,
    refetch: loadSubscription,
  };
}

