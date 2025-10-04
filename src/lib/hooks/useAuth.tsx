'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';

// Add type for Profile
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

  // Derived state
  const isAdmin = role === 'admin';
  const canManageUsers = permissions.includes('users.manage');

  // Helper function to check permissions
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // Load user role and permissions from database
  const loadUserRoleAndPermissions = async (userId: string) => {
    try {
      // Get user role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user role:', profileError);
        return;
      }

      // Explicitly type the profile
      const typedProfile = profile as Pick<Profile, 'role'> | null;

      if (typedProfile) {
        setRole(typedProfile.role);

        // Only fetch permissions if role is not null
        if (typedProfile.role) {
          // Get permissions for this role
          const { data: rolePermissions, error: permError } = await supabase
            .from('role_permissions')
            .select('permission')
            .eq('role', typedProfile.role);

          if (permError) {
            console.error('Error fetching permissions:', permError);
            return;
          }

          // Type the role permissions explicitly
          const typedPermissions = rolePermissions as Pick<RolePermission, 'permission'>[] | null;
          const userPermissions = typedPermissions?.map(p => p.permission) || [];
          setPermissions(userPermissions);

          console.log('User role loaded:', typedProfile.role);
          console.log('User permissions:', userPermissions);
        } else {
          // If role is null, set empty permissions
          setPermissions([]);
          console.log('User has no role assigned');
        }
      }
    } catch (error) {
      console.error('Error loading user role and permissions:', error);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserRoleAndPermissions(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserRoleAndPermissions(session.user.id);
        } else {
          // Clear role and permissions on sign out
          setRole(null);
          setPermissions([]);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      const { error } = await supabase.auth.signOut();
      
      // Clear local state
      setRole(null);
      setPermissions([]);
      
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

  // Method to refresh user data (useful after role changes)
  const refreshUser = async () => {
    if (user) {
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

  // Check admin requirement
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

  // Check specific permission requirement
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

// Updated admin hook
export function useRequireAdmin() {
  const { user, loading, isAdmin, role } = useAuth();
 
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    } else if (!loading && user && !isAdmin) {
      window.location.href = '/dashboard'; // Redirect non-admins to dashboard
    }
  }, [user, loading, isAdmin]);

  return { user, loading, isAdmin, role, isAuthenticated: Boolean(user) };
}

// New hook for permission-based access
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