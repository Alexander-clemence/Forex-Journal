'use client';

import { useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { supabase, inactivityManager, auth } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';
import { useAuthStore } from '@/lib/stores/authStore';
import type { User, Session } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type RolePermission = Database['public']['Tables']['role_permissions']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  permissions: string[];
  isAdmin: boolean;
  canManageUsers: boolean;
  hasPermission: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName?: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const loading = useAuthStore(state => state.loading);
  const role = useAuthStore(state => state.role);
  const permissions = useAuthStore(state => state.permissions);

  const setUser = useAuthStore(state => state.setUser);
  const setSession = useAuthStore(state => state.setSession);
  const setLoading = useAuthStore(state => state.setLoading);
  const setRole = useAuthStore(state => state.setRole);
  const setPermissions = useAuthStore(state => state.setPermissions);
  const clearAuth = useAuthStore(state => state.clearAuth);

  const hasPermissionFromStore = useAuthStore(state => state.hasPermission);
  const isAdmin = useAuthStore(state => state.isAdmin());
  const canManageUsers = useAuthStore(state => state.canManageUsers());
  
  // Use ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const permissionsCacheRef = useRef<Map<string, { permissions: string[], timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const hasPermission = useCallback((permission: string): boolean => {
    return hasPermissionFromStore(permission);
  }, [hasPermissionFromStore]);

  // Optimized: Load user role and permissions with caching and debouncing
  const loadUserRoleAndPermissions = useCallback(async (userId: string) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    // Check cache first
    const cached = permissionsCacheRef.current.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setPermissions(cached.permissions);
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      // Fetch profile with role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user role:', profileError);
        return;
      }

      const typedProfile = profile as (Profile & { role?: string }) | null;

      if (typedProfile?.role) {
        setRole(typedProfile.role);

        // Fetch permissions for this role
        const role = typedProfile.role;
        const { data: rolePermissions, error: permError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', role);

        if (permError) {
          console.error('Error fetching permissions:', permError);
          return;
        }

        const typedPermissions = rolePermissions as Pick<RolePermission, 'permission'>[] | null;
        const userPermissions = typedPermissions?.map(p => p.permission) || [];
        
        setPermissions(userPermissions);
        
        // Cache the results
        permissionsCacheRef.current.set(userId, {
          permissions: userPermissions,
          timestamp: Date.now()
        });
      } else {
        setRole(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error loading user role and permissions:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    const initializeAuth = async () => {
      try {
        // Use getSession for initial load (faster)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Set loading to false immediately for faster UI response
          setLoading(false);
          clearTimeout(loadingTimeout);
          
          // Load role and permissions in background (non-blocking)
          if (session?.user) {
            // Start inactivity timer immediately
            console.log('[Auth] Initializing inactivity timer for user:', session.user.email);
            inactivityManager.start(() => {
              auth.signOutDueToInactivity();
            });
            
            // Load permissions in background without blocking UI
            loadUserRoleAndPermissions(session.user.id).catch(error => {
              console.error('Error loading user permissions:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false immediately for responsive UI
        setLoading(false);
        
        if (session?.user) {
          // Start/restart inactivity timer immediately
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Starting inactivity timer for user:', session.user.email);
            inactivityManager.start(() => {
              auth.signOutDueToInactivity();
            });
          }
          
          // Load permissions in background (non-blocking)
          loadUserRoleAndPermissions(session.user.id).catch(error => {
            console.error('Error loading user permissions:', error);
          });
        } else {
          // Clear role and permissions on sign out
          clearAuth();
          setRole(null);
          setPermissions([]);
          permissionsCacheRef.current.clear();
          inactivityManager.stop();
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
      inactivityManager.stop();
    };
  }, [loadUserRoleAndPermissions]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        // Sign out the user immediately if email is not confirmed
        await supabase.auth.signOut();
        throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
      }

      if (data.user) {
        await loadUserRoleAndPermissions(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role: 'user', // Ensure role is set to 'user' for new signups
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      inactivityManager.stop();
      const { error } = await supabase.auth.signOut();
      clearAuth();
      permissionsCacheRef.current.clear();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const refreshUser = async () => {
    if (user) {
      permissionsCacheRef.current.delete(user.id); // Clear cache for refresh
      await loadUserRoleAndPermissions(user.id);
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    role,
    permissions,
    isAdmin,
    canManageUsers,
    hasPermission,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// PROTECTED ROUTE COMPONENTS
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
 
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  return { user, loading, isAuthenticated: Boolean(user) };
}

export function useRequireAdmin() {
  const { user, loading, isAdmin, role } = useAuth();
 
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    } else if (!loading && user && !isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [user, loading, isAdmin]);

  return { user, loading, isAdmin, role, isAuthenticated: Boolean(user) };
}

export function useRequirePermission(permission: string) {
  const { user, loading, hasPermission } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    } else if (!loading && user && !hasPermission(permission)) {
      window.location.href = '/dashboard';
    }
  }, [user, loading, hasPermission, permission]);

  return { user, loading, hasPermission: hasPermission(permission), isAuthenticated: Boolean(user) };
}