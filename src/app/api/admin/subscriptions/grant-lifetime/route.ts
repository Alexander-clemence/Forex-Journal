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

  if ((profile as any).role !== 'admin') {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true };
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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch lifetime plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('code', 'lifetime')
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Lifetime plan not found' },
        { status: 400 }
      );
    }

    const startsAt = new Date();

    // Update or create subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const planData = plan as any;
    if (existingSubscription) {
      const existingSub = existingSubscription as any;
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: planData.id,
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: null, // Lifetime has no end date
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', existingSub.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
      const planData = plan as any;
      const { error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planData.id,
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: null, // Lifetime has no end date
        } as any);

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lifetime subscription granted successfully',
    });
  } catch (error) {
    console.error('Error granting lifetime subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



