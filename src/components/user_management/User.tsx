'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Database, AuthUser, ProfileWithEmail } from '@/lib/types/database';
import {
  Users,
  Calendar,
  Shield,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  Check,
  X,
  UserCheck,
  Crown,
  Eye,
  EyeOff,
  Headphones,
  ChevronDown,
  RefreshCw,
  UserPlus,
  Gift,
  Infinity
} from 'lucide-react';
import { toast } from 'sonner';
import { getTier, getTierBadgeColor } from '@/lib/utils/subscription';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Use the types from your database.ts file
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type UserWithSubscription = Database['public']['Views']['profile_with_subscription']['Row'] & { email?: string };

const roleOptions = [
  { value: 'user', label: 'User', description: 'Basic trading functionality', icon: UserCheck, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { value: 'premium', label: 'Premium', description: 'Enhanced features and analytics', icon: Crown, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'support', label: 'Support', description: 'Customer service access', icon: Headphones, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'analyst', label: 'Analyst', description: 'Read-only data access', icon: Eye, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'admin', label: 'Admin', description: 'Full system access', icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100' },
];

export default function UserManagement() {
  const authData = useAuth();
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [processingSubscription, setProcessingSubscription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    role: '',
    displayName: '', 
    username: '',
    timezone: '',
    defaultCurrency: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (authData?.hasPermission && authData.hasPermission('users.manage')) {
      loadUsers();
    }
  }, [authData?.hasPermission]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { 
        setError(''); 
        setSuccess(''); 
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call API to get users with subscription info
      const response = await fetch('/api/admin/users-with-subscriptions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call API to update user
      const response = await fetch('/api/admin/update-user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: editingUser,
          role: editForm.role || undefined,
          displayName: editForm.displayName || undefined,
          username: editForm.username || undefined,
          timezone: editForm.timezone || undefined,
          defaultCurrency: editForm.defaultCurrency || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      setEditingUser(null);
      setEditForm({ role: '', displayName: '', username: '', timezone: '', defaultCurrency: '' });
      await loadUsers();
    } catch (err) {
      setError('Failed to update user: ' + (err as any).message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubscriptionAction = async (userId: string, action: 'premium_monthly' | 'premium_yearly' | 'trial' | 'lifetime' | 'cancel') => {
    setProcessingSubscription(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      let endpoint = '';
      let body: any = { userId };

      if (action === 'lifetime') {
        endpoint = '/api/admin/subscriptions/grant-lifetime';
      } else if (action === 'cancel') {
        endpoint = '/api/admin/subscriptions/cancel';
      } else {
        endpoint = '/api/admin/subscriptions/set-premium';
        body = { userId, planCode: action };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      toast.success('Subscription updated successfully');
      await loadUsers();
    } catch (err) {
      toast.error('Failed to update subscription: ' + (err as any).message);
    } finally {
      setProcessingSubscription(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === authData?.user?.id) {
      setError("You cannot delete your own account");
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Deleting user:', userId);
      console.log('Session token exists:', !!session.access_token);

      // Call the API route to delete user (no trailing slash)
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to delete user (${response.status})`);
      }

      setSuccess(data.message || 'User deleted successfully');
      await loadUsers();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete user: ' + (err as any).message);
    }
  };

  const createNewUser = async () => {
    if (!signupForm.email.trim() || !signupForm.password.trim()) {
      setError('Email and password are required');
      return;
    }

    if (!signupForm.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Creating user:', signupForm.email, 'with role:', signupForm.role);
      console.log('Session token exists:', !!session.access_token);

      // Call the API route to create user (no trailing slash)
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
          displayName: signupForm.displayName,
          role: signupForm.role // This now sends the selected role from the form
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `Failed to create user (${response.status})`);
      }

      setSuccess(`User ${signupForm.email} created successfully!`);
      setShowSignupModal(false);
      setSignupForm({ email: '', password: '', displayName: '', role: 'user' });
      
      setTimeout(() => {
        loadUsers();
      }, 1000);
    } catch (err) {
      console.error('Create user error:', err);
      setError('Failed to create user: ' + (err as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleConfig = (role: string | null) => roleOptions.find(r => r.value === role) || roleOptions[0];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!authData || !authData.hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authData.hasPermission('users.manage')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md border border-gray-200 dark:border-gray-700">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end space-x-2 sm:space-x-3">
        <button 
          onClick={loadUsers} 
          className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center space-x-1.5 sm:space-x-2 text-sm"
        >
          <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <button 
          onClick={() => setShowSignupModal(true)} 
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1.5 sm:space-x-2 text-sm"
        >
          <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Add User</span>
        </button>
      </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3"><p className="text-red-800">{error}</p></div>
              <button onClick={() => setError('')} className="ml-auto">
                <X className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
            <div className="flex">
              <Check className="h-5 w-5 text-green-400" />
              <div className="ml-3"><p className="text-green-800">{success}</p></div>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <X className="h-4 w-4 text-green-400" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 sm:px-4 py-2 pr-7 sm:pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="all">All Roles</option>
                {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              </div>
            </div>
          </div>
          {roleOptions.slice(0, 3).map(role => (
            <div key={role.value} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className={`p-2 ${role.bgColor} dark:bg-opacity-20 rounded-lg`}>
                  <role.icon className={`h-6 w-6 ${role.color} dark:text-${role.color.split('-')[1]}-400`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{role.label}s</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {users.filter(u => u.role === role.value).length}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Users ({filteredUsers.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">User</TableHead>
                  <TableHead className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</TableHead>
                  <TableHead className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Subscription</TableHead>
                  <TableHead className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:table-cell">Created</TableHead>
                  <TableHead className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  const isEditing = editingUser === user.id;
                  
                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 align-top">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.displayName}
                              onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                              placeholder="Display Name"
                              className="block w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                              placeholder="Username"
                              className="block w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.display_name || user.email?.split('@')[0] || 'User'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                              {user.username && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">@{user.username}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 ${roleConfig.bgColor} rounded`}>
                              <roleConfig.icon className={`h-3 w-3 ${roleConfig.color}`} />
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleConfig.bgColor} ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div className="space-y-1">
                          {(() => {
                            // Use exact backend logic for isActive
                            const isActive =
                              user.subscription_status === 'active' &&
                              (!user.subscription_ends_at ||
                                new Date(user.subscription_ends_at) > new Date());
                            
                            if (!isActive) {
                              return (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                  Free
                                </span>
                              );
                            }
                            
                            const tier = getTier({
                              plan_code: user.plan_code,
                              subscription_status: user.subscription_status,
                              subscription_ends_at: user.subscription_ends_at || null,
                            });
                            return (
                              <>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeColor(tier.tier)}`}>
                                  {tier.tier === 'trial' && <Gift className="h-3 w-3 mr-1" />}
                                  {tier.tier === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                                  {tier.tier === 'lifetime' && <Infinity className="h-3 w-3 mr-1" />}
                                  {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
                                </span>
                                {user.plan_name && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.plan_name}</div>
                                )}
                                {user.subscription_ends_at && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Expires: {new Date(user.subscription_ends_at).toLocaleDateString()}
                                  </div>
                                )}
                                {tier.tier === 'lifetime' && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Never expires</div>
                                )}
                                {tier.tier === 'trial' && user.subscription_ends_at && (
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {Math.ceil((new Date(user.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <div>{formatDate(user.created_at).split(',')[0]}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{getTimeAgo(user.created_at)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={updateUser}
                              disabled={updating}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-100 rounded disabled:opacity-50"
                            >
                              {updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setEditForm({ role: '', displayName: '', username: '', timezone: '', defaultCurrency: '' });
                              }}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-100 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditForm({
                                  role: user.role || '',
                                  displayName: user.display_name || '',
                                  username: user.username || '',
                                  timezone: user.timezone || '',
                                  defaultCurrency: user.default_currency || ''
                                });
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded"
                                title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {user.id !== authData?.user?.id && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded"
                                  title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            </div>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSubscriptionAction(user.id, e.target.value as any);
                                  e.target.value = '';
                                }
                              }}
                              disabled={processingSubscription === user.id}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                              title="Manage subscription"
                            >
                              <option value="">Sub...</option>
                              <option value="trial">Reset Trial (30 days)</option>
                              <option value="premium_monthly">Grant Premium Monthly</option>
                              <option value="premium_yearly">Grant Premium Yearly</option>
                              <option value="lifetime">Grant Lifetime</option>
                              {(user.subscription_status === 'active' || user.plan_code) && (
                                <option value="cancel">Cancel Subscription</option>
                              )}
                            </select>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Try adjusting your search criteria' 
                    : 'Users will appear here once they sign up or are created by an admin'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {showSignupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New User</h2>
                <button
                  onClick={() => {
                    setShowSignupModal(false);
                    setSignupForm({ email: '', password: '', displayName: '', role: 'user' });
                    setError('');
                    setSuccess('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={signupForm.displayName}
                    onChange={(e) => setSignupForm({...signupForm, displayName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={signupForm.role}
                    onChange={(e) => setSignupForm({...signupForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSignupModal(false);
                    setSignupForm({ email: '', password: '', displayName: '', role: 'user' });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewUser}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}