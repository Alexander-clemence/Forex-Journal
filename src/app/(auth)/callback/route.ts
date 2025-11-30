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
      // Check if this is a new user (first time confirming)
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', data.user.id)
        .single();
      
      // If profile was just created (within last minute), show welcome message
      if (profile?.created_at) {
        const profileAge = Date.now() - new Date(profile.created_at).getTime();
        if (profileAge < 60000) { // Created within last minute
          return NextResponse.redirect(new URL('/dashboard?welcome=trial', requestUrl.origin));
        }
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's an error or no code, redirect to login with error message
  return NextResponse.redirect(new URL('/login?error=email_confirmation_failed', requestUrl.origin));
}

