'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Crown, Zap, CreditCard, Smartphone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/subscription';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Database } from '@/lib/types/database';
import { ForexJournalIcon } from '@/components/ui/ForexJournalIcon';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'visa' | 'mpesa' | 'tigopesa' | 'airtelmoney'>('visa');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      // Filter out trial (auto-applied, not shown) and lifetime (admin-only)
      const visiblePlans = ((data || []) as any[]).filter(
        (p: any) => p && p.code && p.code !== 'lifetime' && p.code !== 'trial' && p.code !== 'trial_30d'
      );
      setPlans(visiblePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planCode: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      router.push('/auth/signin');
      return;
    }

    setProcessing(planCode);

    try {
      // Get session token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        router.push('/auth/signin');
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planCode, provider: selectedProvider }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process subscription');
      }

      const result = await res.json();

      if (result.redirectUrl) {
        // Redirect to payment page
        window.location.href = result.redirectUrl;
      } else {
        // Success - refresh subscription status
        toast.success('Subscription activated successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
    } finally {
      setProcessing(null);
    }
  };

  const getPlanIcon = (code: string) => {
    if (code.includes('premium')) return <Crown className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

  const getPlanFeatures = (code: string) => {
    const baseFeatures = [
      'Unlimited trades',
      'Advanced analytics',
      'Export to CSV/PDF/JSON',
      'Trade journaling',
      'Performance insights',
    ];

    return [
      ...baseFeatures,
      'Priority support',
      'Regular updates',
      'Cloud sync',
      code === 'premium_yearly' ? 'Best value - Save 17%' : 'Monthly billing',
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ForexJournalIcon size={48} className="h-12 w-12" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              FX Journal
            </span>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link href="/features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors font-medium">
              About
            </Link>
            <Link href="/pricing" className="text-foreground hover:text-primary transition-colors font-medium">
              Pricing
            </Link>
            <Link href="/contact" className="text-foreground hover:text-primary transition-colors font-medium">
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <button className="px-6 py-2.5 font-medium transition-all duration-300 text-foreground hover:text-primary">
                  Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-6 py-2.5 font-medium transition-all duration-300 text-foreground hover:text-primary">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Choose the perfect plan for you
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Unlock powerful features to enhance your trading journey.
          </p>

        </div>

        {/* Payment Provider Selection */}
        {plans.length > 0 && (
          <div className="max-w-2xl mx-auto mb-16">
            <label className="block text-sm font-semibold text-foreground mb-4 text-center">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setSelectedProvider('visa')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  selectedProvider === 'visa'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
                }`}
              >
                <CreditCard className={`h-6 w-6 mb-2 ${selectedProvider === 'visa' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${selectedProvider === 'visa' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Visa/Mastercard
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('mpesa')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  selectedProvider === 'mpesa'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
                }`}
              >
                <Smartphone className={`h-6 w-6 mb-2 ${selectedProvider === 'mpesa' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${selectedProvider === 'mpesa' ? 'text-primary' : 'text-muted-foreground'}`}>
                  M-Pesa
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('tigopesa')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  selectedProvider === 'tigopesa'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
                }`}
              >
                <Smartphone className={`h-6 w-6 mb-2 ${selectedProvider === 'tigopesa' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${selectedProvider === 'tigopesa' ? 'text-primary' : 'text-muted-foreground'}`}>
                  TigoPesa
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('airtelmoney')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  selectedProvider === 'airtelmoney'
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
                }`}
              >
                <Smartphone className={`h-6 w-6 mb-2 ${selectedProvider === 'airtelmoney' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${selectedProvider === 'airtelmoney' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Airtel Money
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.code.includes('premium') && plan.code.includes('yearly');
            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  isPopular
                    ? 'border-2 border-primary shadow-lg scale-105 bg-card'
                    : 'border-border bg-card/50 hover:bg-card hover:scale-105'
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${isPopular ? 'bg-primary/20' : 'bg-muted'}`}>
                      {getPlanIcon(plan.code)}
                    </div>
                    <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  </div>
                  {plan.description && (
                    <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                  )}
                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-foreground">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                      <span className="text-muted-foreground text-lg">
                        /{plan.billing_period || 'month'}
                      </span>
                    </div>
                    {plan.code.includes('yearly') && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Save 17% compared to monthly
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-6">
                  <ul className="space-y-4">
                    {getPlanFeatures(plan.code).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        </div>
                        <span className="text-sm text-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full h-12 text-base font-semibold"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.code)}
                    disabled={processing === plan.code}
                  >
                    {processing === plan.code ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Check className="h-5 w-5 text-primary" />
            <p className="text-base">
              Cancel anytime • Secure payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
