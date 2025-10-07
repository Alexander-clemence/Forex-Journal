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
  UserPlus
} from 'lucide-react';

// Use the types from your database.ts file
type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

const roleOptions = [
  { value: 'user', label: 'User', description: 'Basic trading functionality', icon: UserCheck, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { value: 'premium', label: 'Premium', description: 'Enhanced features and analytics', icon: Crown, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'support', label: 'Support', description: 'Customer service access', icon: Headphones, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'analyst', label: 'Analyst', description: 'Read-only data access', icon: Eye, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'admin', label: 'Admin', description: 'Full system access', icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100' },
];

export default function UserManagement() {
  const authData = useAuth();
  const [users, setUsers] = useState<ProfileWithEmail[]>([]);
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
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;

      const profiles = profilesData || [];

      try {
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError || !authUsers) {
          setUsers(profiles);
        } else {
          const usersWithEmails: ProfileWithEmail[] = profiles.map(profile => {
            // @ts-ignore
            const authUser: AuthUser | undefined = authUsers.find((u: AuthUser) => u.id === profile.id);
            return {
              // @ts-ignore - Type inference issue with returned data
              ...profile,
              email: authUser?.email || 'Unknown'
            };
          });
          
          setUsers(usersWithEmails);
        }
      } catch (authErr) {
        console.warn('Could not fetch auth users (admin permissions required):', authErr);
        setUsers(profiles);
      }
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
      const updates: ProfileUpdate = {
        updated_at: new Date().toISOString()
      };

      if (editForm.role) {
        updates.role = editForm.role;
      }
      if (editForm.displayName !== undefined) {
        updates.display_name = editForm.displayName || null;
      }
      if (editForm.username !== undefined) {
        updates.username = editForm.username || null;
      }
      if (editForm.timezone !== undefined) {
        updates.timezone = editForm.timezone || null;
      }
      if (editForm.defaultCurrency !== undefined) {
        updates.default_currency = editForm.defaultCurrency || null;
      }

      const { error } = await supabase
        .from('profiles')
        //@ts-ignore - Type inference issue with returned data
        .update(updates)
        .eq('id', editingUser);

      if (error) throw error;

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

  const deleteUser = async (userId: string) => {
    if (userId === authData?.user?.id) {
      setError("You cannot delete your own account");
      return;
    }
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;

      setSuccess('User deleted successfully');
      await loadUsers();
    } catch (err) {
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
      const { data, error } = await supabase.auth.admin.createUser({
        email: signupForm.email,
        password: signupForm.password,
        user_metadata: {
          display_name: signupForm.displayName || signupForm.email.split('@')[0],
          role: signupForm.role
        }
      });

      if (error) throw error;

      if (data.user) {
        const profileInsert: ProfileInsert = {
          id: data.user.id,
          role: signupForm.role,
          display_name: signupForm.displayName || signupForm.email.split('@')[0]
        };
        
        if (signupForm.displayName) {
          profileInsert.username = signupForm.displayName.toLowerCase().replace(/\s+/g, '_');
        }

        const { error: profileError } = await supabase
          .from('profiles')
          //@ts-ignore - Type inference issue with returned data
          .insert(profileInsert);

        if (profileError) throw profileError;

        setSuccess(`User ${signupForm.email} created successfully!`);
        setShowSignupModal(false);
        setSignupForm({ email: '', password: '', displayName: '', role: 'user' });
        
        setTimeout(() => {
          loadUsers();
        }, 1000);
      }
    } catch (err) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authData.hasPermission('users.manage')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={loadUsers} 
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button 
                onClick={() => setShowSignupModal(true)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>
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

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Roles</option>
                {roleOptions.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          {roleOptions.slice(0, 3).map(role => (
            <div key={role.value} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className={`p-2 ${role.bgColor} rounded-lg`}>
                  <role.icon className={`h-6 w-6 ${role.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{role.label}s</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === role.value).length}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Users ({filteredUsers.length})</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  const isEditing = editingUser === user.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.displayName}
                              onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                              placeholder="Display Name"
                              className="block w-full text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
                            />
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                              placeholder="Username"
                              className="block w-full text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
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
                              <div className="text-sm font-medium text-gray-900">
                                {user.display_name || user.email?.split('@')[0] || 'User'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.username && (
                                <div className="text-xs text-gray-400">@{user.username}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                            className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <div>{formatDate(user.created_at).split(',')[0]}</div>
                            <div className="text-xs text-gray-400">{getTimeAgo(user.created_at)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {user.id !== authData?.user?.id && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
                <p className="text-sm text-gray-400 mt-2">
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
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Add New User</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={signupForm.displayName}
                    onChange={(e) => setSignupForm({...signupForm, displayName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={signupForm.role}
                    onChange={(e) => setSignupForm({...signupForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    {roleOptions.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
    </div>
  );
}