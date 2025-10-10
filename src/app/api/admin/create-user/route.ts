// app/api/admin/create-user/route.ts
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

  const hasPermission = permissions?.some(
    //@ts-ignore
    p => p.permission?.toLowerCase() === 'users.manage'
  );

  if (!hasPermission) {
    return {
      authorized: false,
      error: 'Forbidden: You do not have permission to create users'
    };
  }

  return { authorized: true };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password, displayName, role = 'user' } = body;

    // 2. Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // 3. Authenticate
    const authResult = await authenticateUser(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // 4. Check permissions
    const permCheck = await checkPermission(authResult.user.id);
    
    if (!permCheck.authorized) {
      return NextResponse.json(
        { success: false, error: permCheck.error || 'Forbidden' },
        { status: 403 }
      );
    }

    // 5. Check if email exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // 6. Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || email.split('@')[0],
        role,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // 7. Update profile (trigger should create it)
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      //@ts-ignore
      .update({
        role,
        display_name: displayName || email.split('@')[0],
        email: email.toLowerCase(),
      })
      .eq('id', authData.user.id);

    if (profileError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // 8. Success
    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        data: {
          id: authData.user.id,
          email: authData.user.email,
          displayName: displayName || email.split('@')[0],
          role,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[API] Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}