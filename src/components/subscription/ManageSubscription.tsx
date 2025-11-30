'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Gift, 
  Zap, 
  Loader2, 
  Calendar, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatCurrency, getTierBadgeColor } from '@/lib/utils/subscription';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SectionHeading } from '@/components/dashboard/SectionHeading';

interface ManageSubscriptionProps {
  showUpgradeOptions?: boolean;
}

export function ManageSubscription({ showUpgradeOptions: showUpgradeOptionsProp = true }: ManageSubscriptionProps) {
  const { user } = useAuth();
  const { subscriptionInfo, tier, hasPremium, loading, refetch } = useSubscription();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'visa' | 'mpesa' | 'tigopesa' | 'airtelmoney'>('visa');
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(showUpgradeOptionsProp && (!hasPremium || tier === 'trial'));
  const [processingUpgrade, setProcessingUpgrade] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    // Only show upgrade options if prop allows it and user doesn't have premium or is on trial
    if (showUpgradeOptionsProp && (!hasPremium || tier === 'trial')) {
      setShowUpgradeOptions(true);
    } else {
      setShowUpgradeOptions(false);
    }
  }, [hasPremium, tier, showUpgradeOptionsProp]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      const visiblePlans = ((data || []) as any[]).filter(
        (p: any) => p && p.code && p.code !== 'lifetime' && p.code !== 'trial' && p.code !== 'trial_30d'
      );
      setPlans(visiblePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    // Redirect to payment page instead of processing directly
    window.location.href = `/dashboard/payment?plan=${planCode}`;
  };

  const handleCancel = async () => {
    if (!user) return;

    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      toast.success('Subscription cancelled successfully');
      setShowCancelDialog(false);
      refetch();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const daysRemaining = useMemo(() => {
    if (!subscriptionInfo?.subscription_ends_at) return null;
    return Math.ceil((new Date(subscriptionInfo.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [subscriptionInfo?.subscription_ends_at]);

  const isTrial = tier === 'trial';
  const isLifetime = tier === 'lifetime';
  const canCancel = hasPremium && !isLifetime && subscriptionInfo?.subscription_status === 'active';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        id="subscription-heading"
        title="Subscription Management"
        description="Manage your subscription plan, billing, and payment methods"
      />

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription plan and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {tier === 'trial' ? 'Trial' : subscriptionInfo?.plan_name || 'Free Plan'}
                </h3>
                <Badge className={getTierBadgeColor(tier)}>
                  {tier === 'trial' && <Gift className="h-3 w-3 mr-1" />}
                  {tier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                  {tier === 'lifetime' && <Zap className="h-3 w-3 mr-1" />}
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Badge>
              </div>
              {tier === 'trial' ? (
                <p className="text-sm text-muted-foreground">
                  30-day free trial with access to all premium features
                </p>
              ) : subscriptionInfo?.plan_name ? (
                <p className="text-sm text-muted-foreground">
                  {subscriptionInfo.plan_name}
                </p>
              ) : null}
            </div>
          </div>

          {/* Status Information */}
          {subscriptionInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  {subscriptionInfo.subscription_status === 'active' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : subscriptionInfo.subscription_status === 'expired' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <p className="font-medium text-foreground capitalize">
                    {subscriptionInfo.subscription_status || 'Inactive'}
                  </p>
                </div>
              </div>
              {subscriptionInfo.subscription_starts_at && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Started</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(subscriptionInfo.subscription_starts_at)}
                  </p>
                </div>
              )}
              {subscriptionInfo.subscription_ends_at && tier !== 'lifetime' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {isTrial ? 'Expires' : 'Renews'}
                  </p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(subscriptionInfo.subscription_ends_at)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Trial Countdown */}
          {isTrial && daysRemaining !== null && (
            <Alert className="bg-primary/10 border-primary/20">
              <Gift className="h-4 w-4 text-primary" />
              <AlertTitle>Trial Period Active</AlertTitle>
              <AlertDescription>
                {daysRemaining > 0 
                  ? `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your trial. Upgrade to Premium to continue after your trial ends.`
                  : 'Your trial has ended. Upgrade to Premium to continue using all features.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Lifetime Badge */}
          {isLifetime && (
            <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <AlertTitle>Lifetime Access</AlertTitle>
              <AlertDescription>
                You have lifetime access to all premium features. No subscription renewal needed.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {showUpgradeOptionsProp && (!hasPremium || isTrial) && (
              <Button 
                className="flex-1"
                onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
              >
                <Crown className="h-4 w-4 mr-2" />
                {showUpgradeOptions ? 'Hide Upgrade Options' : 'Upgrade to Premium'}
              </Button>
            )}
            {canCancel && (
              <Button 
                variant="destructive" 
                onClick={() => setShowCancelDialog(true)}
                className="flex-1"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {showUpgradeOptionsProp && showUpgradeOptions && !loadingPlans && plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Options</CardTitle>
            <CardDescription>
              Choose a plan that works best for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 'visa', label: 'Visa/Mastercard', icon: CreditCard },
                  { value: 'mpesa', label: 'M-Pesa', icon: CreditCard },
                  { value: 'tigopesa', label: 'TigoPesa', icon: CreditCard },
                  { value: 'airtelmoney', label: 'Airtel Money', icon: CreditCard },
                ].map((provider) => (
                  <button
                    key={provider.value}
                    type="button"
                    onClick={() => setSelectedProvider(provider.value as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      selectedProvider === provider.value
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
                    }`}
                  >
                    <provider.icon className={`h-5 w-5 mb-2 ${selectedProvider === provider.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${selectedProvider === provider.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {provider.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isPopular = plan.code.includes('yearly');
                return (
                  <Card
                    key={plan.id}
                    className={`relative transition-all duration-300 hover:shadow-lg ${
                      isPopular
                        ? 'border-2 border-primary'
                        : 'border-border'
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                        Best Value
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-foreground">
                            {formatCurrency(plan.price, plan.currency || 'TZS')}
                          </span>
                          <span className="text-muted-foreground">
                            /{plan.billing_period || 'month'}
                          </span>
                        </div>
                        {plan.code.includes('yearly') && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Save 17% compared to monthly
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Features:</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Unlimited trades
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Advanced analytics
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Export to CSV/PDF/JSON
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Trade journaling
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Performance insights
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Priority support
                          </li>
                        </ul>
                      </div>
                      <Button
                        className="w-full"
                        variant={isPopular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.code)}
                        disabled={processingUpgrade === plan.code}
                      >
                        {processingUpgrade === plan.code ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Cancelling your subscription will stop automatic renewals. You'll continue to have access until {subscriptionInfo?.subscription_ends_at ? formatDate(subscriptionInfo.subscription_ends_at) : 'the end of your billing period'}.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

