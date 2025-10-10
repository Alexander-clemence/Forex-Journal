'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, inactivityManager } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  // Use ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);
  const permissionsCacheRef = useRef<Map<string, { permissions: string[], timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const isAdmin = role === 'admin';
  const canManageUsers = permissions.includes('users.manage');

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

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
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user role:', profileError);
        return;
      }

      const typedProfile = profile as Pick<Profile, 'role'> | null;

      if (typedProfile?.role) {
        setRole(typedProfile.role);

        // Fetch permissions for this role
        const { data: rolePermissions, error: permError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', typedProfile.role);

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
          
          if (session?.user) {
            await loadUserRoleAndPermissions(session.user.id);
            
            // Start inactivity timer
            inactivityManager.start(async () => {
              await supabase.auth.signOut();
              if (typeof window !== 'undefined') {
                alert('You have been signed out due to 10 minutes of inactivity.');
                window.location.href = '/login';
              }
            });
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setLoading(false);
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
        
        if (session?.user) {
          await loadUserRoleAndPermissions(session.user.id);
          
          // Start/restart inactivity timer
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            inactivityManager.start(async () => {
              await supabase.auth.signOut();
              if (typeof window !== 'undefined') {
                alert('You have been signed out due to 10 minutes of inactivity.');
                window.location.href = '/login';
              }
            });
          }
        } else {
          // Clear role and permissions on sign out
          setRole(null);
          setPermissions([]);
          permissionsCacheRef.current.clear();
          inactivityManager.stop();
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
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
          },
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
      
      // Clear local state and cache
      setRole(null);
      setPermissions([]);
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