// app/api/admin/list-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

// ============================================================================
// SUPABASE ADMIN CLIENT
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

async function checkPermission(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { authorized: false, error: 'Error fetching profile' };
  }
//@ts-ignore
  const userRole = profile.role?.toLowerCase() || '';

  const { data: permissions, error: permError } = await supabaseAdmin
    .from('role_permissions')
    .select('permission')
    .eq('role', userRole);

  if (permError) {
    return { authorized: false, error: 'Error checking permissions' };
  }

  const hasPermission = permissions?.some(//@ts-ignore
    p => p.permission?.toLowerCase() === 'users.manage'
  );

  if (!hasPermission) {
    return {
      authorized: false,
      error: 'Forbidden: You do not have permission to list users'
    };
  }

  return { authorized: true };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateUser(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check permissions
    const permCheck = await checkPermission(authResult.user.id);
    
    if (!permCheck.authorized) {
      return NextResponse.json(
        { success: false, error: permCheck.error || 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // 4. Get auth users to get emails
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      // Return profiles without emails if auth fails
      return NextResponse.json({
        success: true,
        data: { users: profiles || [] }
      });
    }

    // 5. Combine profiles with emails
    const usersWithEmails = (profiles || []).map(profile => {//@ts-ignore
      const authUser = authUsers?.find(u => u.id === profile.id);
      return {
        //@ts-ignore
        ...profile,
        email: authUser?.email || 'Unknown'
      };
    });

    // 6. Success
    return NextResponse.json({
      success: true,
      data: {
        users: usersWithEmails,
        total: usersWithEmails.length
      }
    });

  } catch (error: any) {
    console.error('[API] List users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}