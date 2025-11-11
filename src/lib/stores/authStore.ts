import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  permissions: string[];
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setRole: (role: string | null) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  canManageUsers: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  role: null,
  permissions: [],
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setRole: (role) => set({ role }),
  setPermissions: (permissions) => set({ permissions }),
  clearAuth: () => set({ user: null, session: null, role: null, permissions: [] }),
  hasPermission: (permission) => get().permissions.includes(permission),
  isAdmin: () => get().role === 'admin',
  canManageUsers: () => get().permissions.includes('users.manage'),
}));
