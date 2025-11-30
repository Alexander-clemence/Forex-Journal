/**
 * Subscription tier utilities
 */

export type SubscriptionTier = 'free' | 'trial' | 'premium' | 'lifetime';

export interface UserSubscriptionInfo {
  plan_code: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
}

export interface TierInfo {
  tier: SubscriptionTier;
  hasPremium: boolean;
}

/**
 * Get user tier from subscription info
 * Uses exact backend logic: isActive = status === 'active' && (!ends_at || ends_at > now)
 */
export function getTier(subscriptionInfo: UserSubscriptionInfo | null | undefined): TierInfo {
  if (!subscriptionInfo) {
    return { tier: 'free', hasPremium: false };
  }

  // Exact backend logic for isActive
  const isActive =
    subscriptionInfo.subscription_status === 'active' &&
    (!subscriptionInfo.subscription_ends_at ||
      new Date(subscriptionInfo.subscription_ends_at) > new Date());

  if (!isActive) {
    return { tier: 'free', hasPremium: false };
  }

  let tier: SubscriptionTier = 'free';

  if (subscriptionInfo.plan_code === 'trial' || subscriptionInfo.plan_code === 'trial_30d') {
    tier = 'trial';
  } else if (
    subscriptionInfo.plan_code === 'premium_monthly' ||
    subscriptionInfo.plan_code === 'premium_yearly'
  ) {
    tier = 'premium';
  } else if (subscriptionInfo.plan_code === 'lifetime') {
    tier = 'lifetime';
  }

  const hasPremium = tier === 'trial' || tier === 'premium' || tier === 'lifetime';

  return { tier, hasPremium };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'TZS'): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'trial':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'premium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'lifetime':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

