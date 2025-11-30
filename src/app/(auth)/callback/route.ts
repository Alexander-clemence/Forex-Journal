import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Email confirmed successfully
      // Check if this is a new user (first time confirming email)
      // Use user's created_at to determine if they're new
      if (data.user.created_at) {
        const userAge = Date.now() - new Date(data.user.created_at).getTime();
        // If user was created within last 5 minutes, show welcome message
        if (userAge < 300000) { // 5 minutes
          return NextResponse.redirect(new URL('/dashboard?welcome=trial', requestUrl.origin));
        }
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's an error or no code, redirect to login with error message
  return NextResponse.redirect(new URL('/login?error=email_confirmation_failed', requestUrl.origin));
}

