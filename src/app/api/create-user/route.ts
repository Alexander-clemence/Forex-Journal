// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

// IMPORTANT: Verify environment variable is set
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create Supabase admin client with service role key
// This client bypasses RLS policies
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

export async function POST(request: NextRequest) {
  try {
    // Parse request body first
    const body = await request.json();
    const { email, password, displayName, role = 'user' } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    // Verify the requesting user has permission
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Get the session token
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Verify the user with the token (this validates the session)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    // Get the requesting user's role and permissions
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      );
    }

    const userRole = profileData.role;

    if (!userRole) {
      return NextResponse.json(
        { error: 'User has no role assigned' },
        { status: 403 }
      );
    }

    // Check if the user's role has the 'users.manage' permission
    const { data: permissionsData, error: permissionsError } = await supabaseAdmin
      .from('role_permissions')
      .select('permission')
      .eq('role', userRole);

    if (permissionsError) {
      console.error('Permissions error:', permissionsError);
      return NextResponse.json(
        { error: 'Error checking permissions' },
        { status: 500 }
      );
    }

    const permissions = permissionsData?.map(p => p.permission) || [];
    const canManageUsers = permissions.includes('users.manage');

    if (!canManageUsers) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to create users. Required permission: users.manage' },
        { status: 403 }
      );
    }

    // Check if user with this email already exists
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email);

    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user with admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: displayName || email.split('@')[0],
        role: role
      }
    });

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    if (!newUser || !newUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 500 }
      );
    }

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update profile with role and display name (using service role to bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      //@ts-ignore
      .update({
        role: role,
        display_name: displayName || email.split('@')[0],
        email: email
      })
      .eq('id', newUser.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Try to delete the user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'Failed to set user profile. User creation rolled back.' },
        { status: 500 }
      );
    }

    console.log(`User ${email} created successfully by ${user.email} (role: ${userRole})`);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        displayName: displayName || email.split('@')[0],
        role: role
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}