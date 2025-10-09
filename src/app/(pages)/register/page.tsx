'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  UserPlus,
  Trash2,
  Shield,
  ShieldOff,
  Clock,
  Mail,
  Search,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function AdminUserManagement() {
  const { user, loading, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create user form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password.length > 0
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      window.location.href = '/dashboard';
    }
  }, [isAdmin, loading]);

  // Load users
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  // Filter users based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, created_at, last_sign_in_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (err: any) {
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!isPasswordValid) {
      setError('Please ensure all password requirements are met.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Call your API route to create user (server-side with service role key)
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      setSuccess(`User ${formData.email} created successfully!`);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        role: 'user'
      });
      setShowCreateModal(false);
      
      // Reload users list
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      setSuccess(`User ${email} deleted successfully!`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId: string, email: string, newRole: string) => {
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('profiles')
    // @ts-ignore
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(`Updated ${email}'s role to ${newRole}`);
      await loadUsers();
    } catch (err: any) {
      setError(`Failed to update role: ${err.message}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage users and their permissions
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Security Info */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            All users are automatically signed out after 10 minutes of inactivity for security purposes.
          </AlertDescription>
        </Alert>

        {/* Search and Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={loadUsers} disabled={isLoadingUsers}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Users:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{users.length}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Admins:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {users.filter(u => u.role === 'admin').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Users:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {users.filter(u => u.role === 'user').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              View and manage all user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'No users yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Last Sign In</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {u.display_name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, u.email, e.target.value)}
                            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
                            disabled={u.id === user?.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(u.last_sign_in_at || '')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Add a new user to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      placeholder="Enter display name"
                      value={formData.displayName}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                      disabled={isSubmitting}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {formData.password && (
                      <div className="text-xs space-y-1 mt-2">
                        <div className="flex items-center space-x-2">
                          {passwordRequirements.length ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          <span className={passwordRequirements.length ? 'text-green-600' : 'text-red-600'}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {passwordRequirements.uppercase ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          <span className={passwordRequirements.uppercase ? 'text-green-600' : 'text-red-600'}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {passwordRequirements.lowercase ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          <span className={passwordRequirements.lowercase ? 'text-green-600' : 'text-red-600'}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {passwordRequirements.number ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                          <span className={passwordRequirements.number ? 'text-green-600' : 'text-red-600'}>
                            One number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {formData.confirmPassword && (
                      <div className="flex items-center space-x-2 text-xs mt-1">
                        {passwordRequirements.match ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span className={passwordRequirements.match ? 'text-green-600' : 'text-red-600'}>
                          Passwords match
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          email: '',
                          password: '',
                          confirmPassword: '',
                          displayName: '',
                          role: 'user'
                        });
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting || !isPasswordValid}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create User'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}