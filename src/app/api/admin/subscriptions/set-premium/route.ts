import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

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

async function checkAdminPermission(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { authorized: false, error: 'Error fetching profile' };
  }

  if (profile.role !== 'admin') {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true };
}

function calculateEndDate(planCode: string, startsAt: Date): Date {
  const endDate = new Date(startsAt);
  
  if (planCode === 'trial') {
    endDate.setDate(endDate.getDate() + 30);
  } else if (planCode === 'premium_monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planCode === 'premium_yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  return endDate;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const permCheck = await checkAdminPermission(authResult.user.id);
    
    if (!permCheck.authorized) {
      return NextResponse.json(
        { error: permCheck.error || 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, planCode } = body;

    if (!userId || !planCode) {
      return NextResponse.json(
        { error: 'userId and planCode are required' },
        { status: 400 }
      );
    }

    // Fetch plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('code', planCode)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Invalid plan code' },
        { status: 400 }
      );
    }

    const startsAt = new Date();
    const endsAt = planCode === 'lifetime' ? null : calculateEndDate(planCode, startsAt);

    // Update or create subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSubscription) {
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
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
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
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Subscription set to ${plan.name} successfully`,
    });
  } catch (error) {
    console.error('Error setting subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

