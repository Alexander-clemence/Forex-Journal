// app/api/admin/update-user/route.ts
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
      error: 'Forbidden: You do not have permission to update users'
    };
  }

  return { authorized: true };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { userId, role, displayName, username, timezone, defaultCurrency } = body;

    // 2. Validate userId
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
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

    // 5. Check if user exists
    const { data: existingUser, error: existError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 6. Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (role !== undefined) updates.role = role;
    if (displayName !== undefined) updates.display_name = displayName || null;
    if (username !== undefined) updates.username = username || null;
    if (timezone !== undefined) updates.timezone = timezone || null;
    if (defaultCurrency !== undefined) updates.default_currency = defaultCurrency || null;

    // 7. Update profile
    const { data, error: updateError } = await supabaseAdmin
      .from('profiles')//@ts-ignore
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message || 'Failed to update user' },
        { status: 400 }
      );
    }

    // 8. Success
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: data }
    });

  } catch (error: any) {
    console.error('[API] Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}