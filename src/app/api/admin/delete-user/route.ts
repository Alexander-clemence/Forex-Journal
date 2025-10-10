// app/api/admin/delete-user/route.ts
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

async function checkAdminPermission(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { isAdmin: false, error: 'Error verifying permissions' };
  }

  const userRole = profile.role?.trim().toLowerCase() || '';
  const isAdmin = userRole === 'admin';

  if (!isAdmin) {
    return {
      isAdmin: false,
      error: 'Forbidden: Admin access required',
    };
  }

  return { isAdmin: true };
}

async function deleteUserRelatedData(userId: string) {
  const deletionLog: string[] = [];

  // Delete related records in order (add your tables here)
  const tablesToClean = [
    'trades',
    'journal_entries',
    'strategies',
    // Add any other tables that have user_id foreign keys
  ];

  for (const table of tablesToClean) {
    try {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.warn(`[Delete] Failed to delete from ${table}:`, error);
        deletionLog.push(`${table}: ${error.message}`);
      } else {
        deletionLog.push(`${table}: cleaned`);
      }
    } catch (err) {
      console.warn(`[Delete] Exception deleting from ${table}:`, err);
      deletionLog.push(`${table}: exception`);
    }
  }

  return deletionLog;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // 1. Parse body
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { userId, force = false } = body;

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

    // 4. Check admin permission
    const adminCheck = await checkAdminPermission(authResult.user.id);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { success: false, error: adminCheck.error || 'Forbidden' },
        { status: 403 }
      );
    }

    // 5. Prevent self-deletion
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // 6. Get target user
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`[Delete] Starting deletion process for user: ${targetUser.email}`);

    // 7. Delete related data first
    const deletionLog = await deleteUserRelatedData(userId);
    console.log('[Delete] Related data cleanup:', deletionLog);

    // 8. Delete from profiles table
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('[Delete] Profile deletion error:', profileDeleteError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to delete profile: ${profileDeleteError.message}. Try enabling force delete or check foreign key constraints.`,
          details: deletionLog
        },
        { status: 400 }
      );
    }

    // 9. Delete user from auth (final step)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
      force // Use force flag if provided
    );

    if (authDeleteError) {
      console.error('[Delete] Auth user deletion error:', authDeleteError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to delete auth user: ${authDeleteError.message}`,
          details: deletionLog
        },
        { status: 400 }
      );
    }

    console.log(`[Delete] Successfully deleted user: ${targetUser.email}`);

    // 10. Success
    return NextResponse.json(
      {
        success: true,
        message: `User ${targetUser.email} deleted successfully`,
        details: deletionLog
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Delete user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}