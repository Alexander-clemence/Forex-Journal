import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

// Service role client for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization token' };
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: 'Invalid session' };
  }

  return { user, error: null };
}

type PaymentProvider = 'visa' | 'mpesa' | 'tigopesa' | 'airtelmoney';

interface CheckoutRequest {
  planCode: string;
  provider?: PaymentProvider;
}

/**
 * Dummy payment processor - simulates payment processing
 */
async function processDummyPayment(
  userId: string,
  plan: Database['public']['Tables']['subscription_plans']['Row'],
  provider: PaymentProvider = 'visa'
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // For demo purposes, always succeed
  // In production, this would call the actual payment provider API
  const transactionId = `${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Simulate different success rates based on provider (for testing)
  const success = true; // Always success for dummy

  return {
    success,
    transactionId: success ? transactionId : undefined,
    error: success ? undefined : `Payment failed with ${provider}`,
  };
}

/**
 * Calculate subscription end date
 */
function calculateEndDate(planCode: string, startsAt: Date): Date {
  const endDate = new Date(startsAt);
  
  if (planCode === 'trial') {
    endDate.setDate(endDate.getDate() + 30);
  } else if (planCode === 'premium_monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planCode === 'premium_yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (planCode === 'lifetime') {
    // Lifetime has no end date (NULL)
    return endDate; // Will be set to NULL
  }
  
  return endDate;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { planCode, provider = 'visa' } = body;

    // Validate plan code is not lifetime (admin-only)
    if (planCode === 'lifetime') {
      return NextResponse.json(
        { error: 'Lifetime plans can only be granted by admins' },
        { status: 403 }
      );
    }

    // Authenticate user
    const authResult = await authenticateUser(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Fetch plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('code', planCode)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Invalid or inactive plan' },
        { status: 400 }
      );
    }

    // Process payment
    const paymentResult = await processDummyPayment(userId, plan, provider);

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment failed' },
        { status: 402 }
      );
    }

    const startsAt = new Date();
    const endsAt = planCode === 'lifetime' ? null : calculateEndDate(planCode, startsAt);

    // Create payment transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.price,
        currency: plan.currency,
        provider: provider,
        status: 'completed',
        transaction_id: paymentResult.transactionId || null,
        metadata: {
          plan_code: planCode,
          dummy_payment: true,
        },
      });

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError);
      // Continue anyway - payment succeeded
    }

    // Create or update subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt ? endsAt.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt ? endsAt.toISOString() : null,
        });

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
    }

    // For dummy payments, return success immediately
    // In production with real providers, you might redirect to a payment page
    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      transactionId: paymentResult.transactionId,
      // redirectUrl: undefined // If using hosted checkout, return URL here
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

