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

    // Cancel subscription
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



