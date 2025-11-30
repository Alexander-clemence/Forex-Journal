'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/dashboard/SectionHeading';
import { 
  CreditCard, 
  Smartphone, 
  Loader2, 
  ArrowLeft,
  Receipt,
  Calendar,
  User,
  Mail,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/subscription';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

type PaymentProvider = 'visa' | 'mpesa' | 'tigopesa' | 'airtelmoney';

interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  currency: string;
  billing_period: string;
  description: string | null;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('visa');
  const [processing, setProcessing] = useState(false);
  
  // Form fields for different payment methods
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const planCode = searchParams.get('plan');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!planCode) {
      router.push('/dashboard/subscription');
      return;
    }

    loadPlan();
  }, [planCode, user, router]);

  const loadPlan = async () => {
    if (!planCode) {
      toast.error('Plan not specified');
      router.push('/dashboard/subscription');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('code', planCode)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Plan not found');
        router.push('/dashboard/subscription');
        return;
      }

      setPlan(data);
    } catch (error) {
      console.error('Error loading plan:', error);
      toast.error('Failed to load plan details');
      router.push('/dashboard/subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!plan) return;

    // Validate form based on selected provider
    if (selectedProvider === 'visa') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        toast.error('Please fill in all card details');
        return;
      }
    } else {
      if (!phoneNumber) {
        toast.error('Please enter your phone number');
        return;
      }
    }

    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show message that payment is not available
    toast.error('Payment processing is currently unavailable. This is a demo environment.', {
      duration: 5000,
    });

    setProcessing(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const invoiceNumber = `INV-${Date.now()}`;
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        id="payment-heading"
        title="Complete Payment"
        description="Review your invoice and complete the payment"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  <CardTitle>Invoice</CardTitle>
                </div>
                <Badge variant="outline">{invoiceNumber}</Badge>
              </div>
              <CardDescription>Invoice Date: {invoiceDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bill To */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Bill To:</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">{plan.description || 'Premium subscription plan'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(plan.price, plan.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">per {plan.billing_period}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(plan.price, plan.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { value: 'visa' as PaymentProvider, label: 'Visa/Mastercard', icon: CreditCard },
                  { value: 'mpesa' as PaymentProvider, label: 'M-Pesa', icon: Smartphone },
                  { value: 'tigopesa' as PaymentProvider, label: 'TigoPesa', icon: Smartphone },
                  { value: 'airtelmoney' as PaymentProvider, label: 'Airtel Money', icon: Smartphone },
                ].map((provider) => (
                  <button
                    key={provider.value}
                    type="button"
                    onClick={() => setSelectedProvider(provider.value)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      selectedProvider === provider.value
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80'
                    }`}
                  >
                    <provider.icon className={`h-6 w-6 mb-2 ${selectedProvider === provider.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium text-center ${selectedProvider === provider.value ? 'text-primary' : 'text-muted-foreground'}`}>
                      {provider.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Payment Form */}
              {selectedProvider === 'visa' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiry Date</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder={selectedProvider === 'mpesa' ? '255712345678' : selectedProvider === 'tigopesa' ? '255712345678' : '255712345678'}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your {selectedProvider === 'mpesa' ? 'M-Pesa' : selectedProvider === 'tigopesa' ? 'TigoPesa' : 'Airtel Money'} registered phone number
                    </p>
                  </div>
                </div>
              )}

              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a demo environment. Payment processing is not available at this time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing Period</span>
                  <span className="font-medium text-foreground capitalize">{plan.billing_period}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedProvider === 'visa' ? 'Visa/Mastercard' : 
                     selectedProvider === 'mpesa' ? 'M-Pesa' :
                     selectedProvider === 'tigopesa' ? 'TigoPesa' : 'Airtel Money'}
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(plan.price, plan.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/subscription')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

