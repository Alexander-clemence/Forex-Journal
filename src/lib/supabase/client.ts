import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/types/database';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================================
// BROWSER CLIENT - SINGLETON WITH SSR SUPPORT
// ============================================================================

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// ============================================================================
// TYPES
// ============================================================================

type ActivityEvent = 'mousedown' | 'keydown' | 'touchstart' | 'scroll';

interface InactivityConfig {
  timeout?: number; // milliseconds
  throttle?: number; // milliseconds
  onWarning?: (secondsRemaining: number) => void;
  warningTime?: number; // seconds before timeout to show warning
}

// ============================================================================
// INACTIVITY MANAGER - ENHANCED WITH WARNING SYSTEM
// ============================================================================

const DEFAULT_INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const DEFAULT_ACTIVITY_THROTTLE = 2000; // 2 seconds
const DEFAULT_WARNING_TIME = 60; // 1 minute before timeout

class InactivityManager {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTime = Date.now();
  private isListenerActive = false;
  private timeoutCallback: (() => void) | null = null;
  private warningCallback: ((secondsRemaining: number) => void) | null = null;
  
  private config: Required<InactivityConfig> = {
    timeout: DEFAULT_INACTIVITY_TIMEOUT,
    throttle: DEFAULT_ACTIVITY_THROTTLE,
    onWarning: () => {},
    warningTime: DEFAULT_WARNING_TIME,
  };

  private readonly ACTIVITY_EVENTS: ActivityEvent[] = [
    'mousedown',
    'keydown', 
    'touchstart',
    'scroll'
  ];

  private throttledActivityHandler = () => {
    const now = Date.now();
    
    if (now - this.lastActivityTime >= this.config.throttle) {
      this.lastActivityTime = now;
      this.reset();
    }
  };

  private reset() {
    if (!this.timeoutCallback) return;
    
    // Clear existing timers
    if (this.timer) clearTimeout(this.timer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    
    // Set warning timer
    const warningMs = this.config.timeout - (this.config.warningTime * 1000);
    if (warningMs > 0 && this.warningCallback) {
      this.warningTimer = setTimeout(() => {
        if (this.warningCallback) {
          this.warningCallback(this.config.warningTime);
        }
      }, warningMs);
    }
    
    // Set main timeout timer
    this.timer = setTimeout(() => {
      if (this.timeoutCallback) {
        console.log('[Inactivity] User inactive, executing timeout callback');
        this.timeoutCallback();
      }
    }, this.config.timeout);
  }

  start(onTimeout: () => void, config?: InactivityConfig) {
    if (typeof window === 'undefined') return;
    
    // Update configuration
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.timeoutCallback = onTimeout;
    this.warningCallback = config?.onWarning || null;
    this.lastActivityTime = Date.now();
    
    // Clear any existing setup
    this.stop();
    
    // Start the timeout
    this.reset();
    
    // Add activity listeners
    if (!this.isListenerActive) {
      this.ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(
          event, 
          this.throttledActivityHandler, 
          { passive: true, capture: true }
        );
      });
      this.isListenerActive = true;
    }
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    this.timeoutCallback = null;
    this.warningCallback = null;
    
    if (this.isListenerActive && typeof window !== 'undefined') {
      this.ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, this.throttledActivityHandler, true);
      });
      this.isListenerActive = false;
    }
  }

  isActive() {
    return this.timer !== null;
  }

  manualReset() {
    if (this.isActive()) {
      this.reset();
    }
  }

  getLastActivityTime() {
    return this.lastActivityTime;
  }
}

export const inactivityManager = new InactivityManager();

// ============================================================================
// STORAGE CLEANUP UTILITY
// ============================================================================

function cleanupSupabaseStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    // Only clear Supabase-specific items from localStorage
    const keys = Object.keys(localStorage);
    const supabaseKeys = keys.filter(key => 
      key.startsWith(`sb-${supabaseUrl.split('//')[1]?.split('.')[0] || 'sb'}`)
    );
    
    supabaseKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('[Storage] Failed to remove key:', key);
      }
    });
  } catch (error) {
    console.error('[Storage] Cleanup failed:', error);
  }
}

// ============================================================================
// AUTH HELPERS - TYPE-SAFE & OPTIMIZED
// ============================================================================

export const auth = {
  /**
   * Sign up a new user
   */
  signUp: async (email: string, password: string, displayName?: string) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
          role: 'user'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    return result;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Start inactivity timer on successful sign in
    if (result.data.session && !result.error) {
      inactivityManager.start(() => {
        auth.signOutDueToInactivity();
      });
    }
    
    return result;
  },

  /**
   * Standard sign out (current device only)
   */
  signOut: async () => {
    inactivityManager.stop();
    
    const result = await supabase.auth.signOut();
    
    cleanupSupabaseStorage();
    
    return result;
  },

  /**
   * Global sign out (all devices)
   */
  signOutEverywhere: async () => {
    inactivityManager.stop();
    
    const result = await supabase.auth.signOut({ scope: 'global' });
    
    cleanupSupabaseStorage();
    
    return result;
  },

  /**
   * Sign out due to inactivity with user notification
   */
  signOutDueToInactivity: async () => {
    console.log('[Auth] Signing out due to inactivity');
    inactivityManager.stop();
    
    await supabase.auth.signOut();
    cleanupSupabaseStorage();
    
    if (typeof window !== 'undefined') {
      // Use a more modern notification approach
      // You should replace this with a toast/modal in your app
      const message = 'You have been signed out due to inactivity.';
      
      // Store message for display on login page
      sessionStorage.setItem('auth_message', JSON.stringify({
        type: 'info',
        message,
        timestamp: Date.now()
      }));
      
      window.location.href = '/login';
    }
  },

  /**
   * Get current user (makes API call - use sparingly)
   * Prefer getSession() for better performance
   */
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  /**
   * Get current session (client-side only, fast)
   * Use this for most auth checks in client components
   */
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  /**
   * Get user profile from database
   */
  getProfile: async (userId?: string) => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { session } = await auth.getSession();
      if (!session?.user) {
        return { 
          profile: null, 
          error: new Error('No authenticated user') 
        };
      }
      targetUserId = session.user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    return { profile: data, error };
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Start/stop inactivity manager based on auth state
        if (event === 'SIGNED_IN' && session) {
          inactivityManager.start(() => {
            auth.signOutDueToInactivity();
          });
        } else if (event === 'SIGNED_OUT') {
          inactivityManager.stop();
        }
        
        callback(event, session);
      }
    );
    
    return subscription;
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string) => {
    if (typeof window === 'undefined') {
      throw new Error('resetPassword can only be called in browser context');
    }
    
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
  },

  /**
   * Update password (requires current session)
   */
  updatePassword: async (newPassword: string) => {
    return await supabase.auth.updateUser({
      password: newPassword
    });
  },

  /**
   * Refresh the current session
   */
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (data.session && !error) {
      inactivityManager.manualReset();
    }
    
    return { data, error };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async () => {
    const { session } = await auth.getSession();
    return !!session;
  }
};

// ============================================================================
// DATABASE HELPERS - TYPE-SAFE
// ============================================================================

type TradeInsert = Database['public']['Tables']['trades']['Insert'];
type TradeUpdate = Database['public']['Tables']['trades']['Update'];
type JournalInsert = Database['public']['Tables']['journal_entries']['Insert'];
type JournalUpdate = Database['public']['Tables']['journal_entries']['Update'];
type StrategyInsert = Database['public']['Tables']['strategies']['Insert'];
type StrategyUpdate = Database['public']['Tables']['strategies']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const db = {
  trades: {
    getAll: async () => {
      return await supabase
        .from('trades')
        .select('*')
        .order('entry_date', { ascending: false });
    },

    getById: async (id: string) => {
      return await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .single();
    },

    create: async (trade: TradeInsert) => {
      return await supabase
        .from('trades')//@ts-ignore
        .insert(trade)
        .select()
        .single();
    },

    update: async (id: string, updates: TradeUpdate) => {
      return await supabase
        .from('trades')//@ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    },

    delete: async (id: string) => {
      return await supabase
        .from('trades')
        .delete()
        .eq('id', id);
    }
  },

  journal: {
    getAll: async () => {
      return await supabase
        .from('journal_entries')
        .select('*')
        .order('entry_date', { ascending: false });
    },

    getByDate: async (date: string) => {
      return await supabase
        .from('journal_entries')
        .select('*')
        .eq('entry_date', date)
        .single();
    },

    create: async (entry: JournalInsert) => {
      return await supabase
        .from('journal_entries')//@ts-ignore
        .insert(entry)
        .select()
        .single();
    },

    update: async (id: string, updates: JournalUpdate) => {
      return await supabase
        .from('journal_entries')//@ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    }
  },

  strategies: {
    getAll: async () => {
      return await supabase
        .from('strategies')
        .select('*')
        .order('name');
    },

    create: async (strategy: StrategyInsert) => {
      return await supabase
        .from('strategies')//@ts-ignore
        .insert(strategy)
        .select()
        .single();
    },

    update: async (id: string, updates: StrategyUpdate) => {
      return await supabase
        .from('strategies')//@ts-ignore
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    },

    delete: async (id: string) => {
      return await supabase
        .from('strategies')
        .delete()
        .eq('id', id);
    }
  },

  profile: {
    get: async () => {
      const { session } = await auth.getSession();
      if (!session?.user) {
        return {
          data: null,
          error: new Error('User not authenticated')
        };
      }
      
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
    },

    update: async (updates: ProfileUpdate) => {
      const { session } = await auth.getSession();
      if (!session?.user) {
        return {
          data: null,
          error: new Error('User not authenticated')
        };
      }
      
      return await supabase
        .from('profiles')
        //@ts-ignore
        .update(updates)
        .eq('id', session.user.id)
        .select()
        .single();
    }
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS - TYPE-SAFE
// ============================================================================

type RealtimeCallback = (payload: any) => void;

export const subscriptions = {
  /**
   * Subscribe to trades table changes
   */
  trades: (callback: RealtimeCallback) => {
    return supabase
      .channel('trades_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades' },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to journal entries table changes
   */
  journal: (callback: RealtimeCallback) => {
    return supabase
      .channel('journal_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        callback
      )
      .subscribe();
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: async (channel: ReturnType<typeof supabase.channel>) => {
    return await supabase.removeChannel(channel);
  },

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll: () => {
    return supabase.removeAllChannels();
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const utils = {
  /**
   * Check if code is running in browser
   */
  isBrowser: () => typeof window !== 'undefined',

  /**
   * Get auth message from session storage (for post-redirect messages)
   */
  getAuthMessage: () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const message = sessionStorage.getItem('auth_message');
      if (message) {
        sessionStorage.removeItem('auth_message');
        return JSON.parse(message);
      }
    } catch (e) {
      console.error('[Utils] Failed to get auth message:', e);
    }
    
    return null;
  },

  /**
   * Format Supabase error for display
   */
  formatError: (error: any): string => {
    if (!error) return 'An unknown error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.error_description) return error.error_description;
    
    return 'An unexpected error occurred';
  }
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default supabase;