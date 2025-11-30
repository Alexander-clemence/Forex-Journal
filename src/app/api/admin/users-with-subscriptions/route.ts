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

export async function GET(request: NextRequest) {
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

    // Fetch all users with subscription info
    const { data, error } = await supabaseAdmin
      .from('profile_with_subscription')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: data || [],
    });
  } catch (error) {
    console.error('Error fetching users with subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



