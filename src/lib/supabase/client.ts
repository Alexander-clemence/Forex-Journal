import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';
import { useState, useEffect } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Inactivity Timer Configuration - CHANGED TO 10 MINUTES
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
let inactivityTimer: NodeJS.Timeout | null = null;
let isInactivityListenerActive = false;

// Activity events to track
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click'
];

// Inactivity Timer Management
export const inactivityManager = {
  // Start the inactivity timer
  start: (onTimeout: () => void) => {
    if (typeof window === 'undefined') return; // Server-side check
    
    // Clear any existing timer
    inactivityManager.stop();
    
    // Set up the timeout
    inactivityTimer = setTimeout(() => {
      console.log('User inactive for 10 minutes, signing out...');
      onTimeout();
    }, INACTIVITY_TIMEOUT);
    
    // Add activity listeners if not already active
    if (!isInactivityListenerActive) {
      ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, inactivityManager.resetTimer, true);
      });
      isInactivityListenerActive = true;
    }
  },

  // Reset the timer on user activity
  resetTimer: () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      
      // Restart the timer
      const onTimeout = () => {
        auth.signOutDueToInactivity();
      };
      
      inactivityTimer = setTimeout(() => {
        console.log('User inactive for 10 minutes, signing out...');
        onTimeout();
      }, INACTIVITY_TIMEOUT);
    }
  },

  // Stop the inactivity timer
  stop: () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    
    // Remove activity listeners
    if (isInactivityListenerActive && typeof window !== 'undefined') {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, inactivityManager.resetTimer, true);
      });
      isInactivityListenerActive = false;
    }
  },

  // Check if timer is active
  isActive: () => inactivityTimer !== null
};

// Enhanced Auth helpers (CLIENT-SIDE ONLY)
export const auth = {
  // Sign up (regular user registration only)
  signUp: async (email: string, password: string, displayName?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
          role: 'user' // Regular users always get 'user' role
        }
      }
    });
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Start inactivity timer on successful sign in
    if (result.data.user && !result.error) {
      inactivityManager.start(() => {
        auth.signOutDueToInactivity();
      });
    }
    
    return result;
  },

  // Standard sign out (current session only)
  signOut: async () => {
    // Stop inactivity timer
    inactivityManager.stop();
    
    // Sign out from current session
    const result = await supabase.auth.signOut();
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    return result;
  },

  // Global sign out (all sessions/devices)
  signOutEverywhere: async () => {
    // Stop inactivity timer
    inactivityManager.stop();
    
    // Sign out from all devices
    const result = await supabase.auth.signOut({ scope: 'global' });
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    return result;
  },

  // Sign out due to inactivity
  signOutDueToInactivity: async () => {
    console.log('Signing out due to inactivity...');
    
    // Stop inactivity timer
    inactivityManager.stop();
    
    // Sign out from current session
    const result = await supabase.auth.signOut();
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Show notification or redirect
      alert('You have been signed out due to 10 minutes of inactivity.');
      window.location.href = '/login';
    }
    
    return result;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Get user profile
  getUserProfile: async (userId?: string) => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { user } = await auth.getCurrentUser();
      if (!user) throw new Error('No authenticated user');
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    return { profile: data, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Handle inactivity timer based on auth state
      if (event === 'SIGNED_IN' && session) {
        inactivityManager.start(() => {
          auth.signOutDueToInactivity();
        });
      } else if (event === 'SIGNED_OUT') {
        inactivityManager.stop();
      }
      
      // Call the original callback
      callback(event, session);
    });
  },

  // Reset password
  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  },

  // Refresh session and reset inactivity timer
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    
    // Reset inactivity timer on successful refresh
    if (data.session && !error) {
      inactivityManager.resetTimer();
    }
    
    return { data, error };
  },

  // Manual activity trigger (useful for API calls, etc.)
  recordActivity: () => {
    inactivityManager.resetTimer();
  }
};

// Database helpers
export const db = {
  // Trades
  trades: {
    getAll: () => {
      auth.recordActivity(); // Record activity on database interaction
      return supabase
        .from('trades')
        .select('*')
        .order('entry_date', { ascending: false });
    },

    getById: (id: string) => {
      auth.recordActivity();
      return supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .single();
    },

    create: (trade: any) => {
      auth.recordActivity();
      return supabase
        .from('trades')
        .insert(trade)
        .select()
        .single();
    },

    update: (id: string, updates: any) => {
      auth.recordActivity();
      return supabase
        .from('trades')
        // @ts-ignore - Type inference issue with returned data
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    },

    delete: (id: string) => {
      auth.recordActivity();
      return supabase
        .from('trades')
        .delete()
        .eq('id', id);
    }
  },

  // Journal entries
  journal: {
    getAll: () => {
      auth.recordActivity();
      return supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false });
    },

    getByDate: (date: string) => {
      auth.recordActivity();
      return supabase
        .from('journal_entries')
        .select('*')
        .eq('entry_date', date)
        .single();
    },

    create: (entry: any) => {
      auth.recordActivity();
      return supabase
        .from('journal_entries')
        .insert(entry)
        .select()
        .single();
    },

    update: (id: string, updates: any) => {
      auth.recordActivity();
      return supabase
        .from('journal_entries')
        // @ts-ignore - Type inference issue with returned data
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    }
  },

  // Strategies
  strategies: {
    getAll: () => {
      auth.recordActivity();
      return supabase
        .from('strategies')
        .select('*')
        .order('name');
    },

    create: (strategy: any) => {
      auth.recordActivity();
      return supabase
        .from('strategies')
        .insert(strategy)
        .select()
        .single();
    },

    update: (id: string, updates: any) => {
      auth.recordActivity();
      return supabase
        .from('strategies')
        // @ts-ignore - Type inference issue with returned data
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    },

    delete: (id: string) => {
      auth.recordActivity();
      return supabase
        .from('strategies')
        .delete()
        .eq('id', id);
    }
  },

  // Profile
  profile: {
    get: () => {
      auth.recordActivity();
      return supabase
        .from('profiles')
        .select('*')
        .single();
    },

    update: async (updates: any) => {
      auth.recordActivity();
      const { user } = await auth.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return supabase
        .from('profiles')
        // @ts-ignore - Type inference issue with returned data
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
    }
  }
};

// Real-time subscriptions
export const subscriptions = {
  trades: (callback: (payload: any) => void) => {
    auth.recordActivity(); // Record activity when setting up subscriptions
    return supabase
      .channel('trades_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades' },
        (payload) => {
          auth.recordActivity(); // Record activity on real-time events
          callback(payload);
        }
      )
      .subscribe();
  },

  journal: (callback: (payload: any) => void) => {
    auth.recordActivity();
    return supabase
      .channel('journal_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        (payload) => {
          auth.recordActivity();
          callback(payload);
        }
      )
      .subscribe();
  }
};

// React Hook for using enhanced auth features
export function useEnhancedAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    auth.getCurrentSession().then(({ session }) => {
      // @ts-ignore - Type inference issue with returned data
      setSession(session);
      // @ts-ignore - Type inference issue with returned data
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      inactivityManager.stop(); // Clean up on unmount
    };
  }, []);

  const signOut = async (global = false) => {
    try {
      if (global) {
        await auth.signOutEverywhere();
      } else {
        await auth.signOut();
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isInactivityTimerActive: inactivityManager.isActive(),
    recordActivity: auth.recordActivity
  };
}