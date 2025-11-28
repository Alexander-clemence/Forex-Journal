'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSettings } from '@/lib/hooks/useSettings';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Download,
  Moon,
  Sun,
  Monitor,
  Check,
  Loader2,
  Save,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { UpdateSettings } from '@/components/update/UpdateNotification';

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: Sun, description: 'Light theme' },
  { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Dark theme' },
  { value: 'system' as const, label: 'System', icon: Monitor, description: 'Follow system preference' }
];

const NOTIFICATION_OPTIONS = [
  {
    key: 'dailySummary',
    label: 'Daily Trading Summary',
    description: 'Receive a daily summary of your trading performance'
  },
  {
    key: 'tradeReminders',
    label: 'Trade Reminders',
    description: 'Get reminders about open positions and pending orders'
  },
  {
    key: 'updateNotifications',
    label: 'App Updates',
    description: 'Notifications about new app versions and features'
  }
];

const PasswordStrengthIndicator = memo(({ password, confirmPassword }: { 
  password: string; 
  confirmPassword: string;
}) => {
  const checks = useMemo(() => [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Contains number', valid: /[0-9]/.test(password) },
    { label: 'Passwords match', valid: password === confirmPassword && !!confirmPassword }
  ], [password, confirmPassword]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 dark:text-gray-400">Password strength:</div>
      <div className="space-y-1">
        {checks.map(({ label, valid }) => (
          <div key={label} className={`flex items-center space-x-2 text-xs ${
            valid ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${valid ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

const ThemeButton = memo(({ 
  value, 
  label, 
  icon: Icon, 
  description, 
  isActive, 
  onClick 
}: { 
  value: string;
  label: string;
  icon: any;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center space-y-3 p-4 rounded-lg border-2 transition-all ${
      isActive 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
    }`}
  >
    {isActive && (
      <div className="absolute top-2 right-2">
        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
    )}
    <Icon className={`h-8 w-8 ${
      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
    }`} />
    <div className="text-center">
      <div className="font-medium">{label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
    </div>
  </button>
));

ThemeButton.displayName = 'ThemeButton';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { settings, loading, saving, saveSettings, updateProfile, exportData } = useSettings();
  const { setTheme: setGlobalTheme } = useTheme();
  
  const [profile, setProfile] = useState({
    displayName: '',
    timezone: 'UTC',
    defaultCurrency: 'USD'
  });

  const [notifications, setNotifications] = useState({
    dailySummary: true,
    tradeReminders: false,
    updateNotifications: true
  });

  const [tradingPrefs, setTradingPrefs] = useState({
    defaultPositionSize: 1000,
    riskPerTrade: 2
  });

  const [passwordChange, setPasswordChange] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    if (settings) {
      setProfile({
        displayName: settings.display_name || user?.user_metadata?.display_name || '',
        timezone: settings.timezone,
        defaultCurrency: settings.default_currency
      });
      
      setNotifications({
        dailySummary: settings.notifications.daily_summary,
        tradeReminders: settings.notifications.trade_reminders,
        updateNotifications: settings.notifications.update_notifications
      });

      setTradingPrefs({
        defaultPositionSize: settings.trading_preferences.default_position_size || 1000,
        riskPerTrade: settings.trading_preferences.risk_per_trade || 2
      });

      setTheme(settings.theme);
    }
  }, [settings, user]);

  const handleSaveProfile = useCallback(async () => {
    try {
      await updateProfile({ display_name: profile.displayName });
      await saveSettings({
        timezone: profile.timezone,
        default_currency: profile.defaultCurrency
      });
      
      toast.success('Profile Updated', {
        description: 'Your profile has been saved successfully.'
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save profile. Please try again.'
      });
    }
  }, [profile, updateProfile, saveSettings]);

  const handleThemeChange = useCallback(async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
    
    try {
      await saveSettings({ theme: newTheme });
      toast.success('Theme Updated', {
        description: 'Your theme preference has been saved.'
      });
    } catch (error) {
      setTheme(settings?.theme || 'system');
      setGlobalTheme(settings?.theme || 'system');
      toast.error('Error', {
        description: 'Failed to save theme preference.'
      });
    }
  }, [saveSettings, settings?.theme, setGlobalTheme]);

  const handleSaveTradingPreferences = useCallback(async () => {
    try {
      await saveSettings({
        trading_preferences: {
          default_position_size: tradingPrefs.defaultPositionSize,
          risk_per_trade: tradingPrefs.riskPerTrade
        }
      });
      
      toast.success('Trading Preferences Updated', {
        description: 'Your trading preferences have been saved successfully.'
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save trading preferences. Please try again.'
      });
    }
  }, [tradingPrefs, saveSettings]);

  const handleSaveNotifications = useCallback(async () => {
    try {
      await saveSettings({
        notifications: {
          daily_summary: notifications.dailySummary,
          trade_reminders: notifications.tradeReminders,
          update_notifications: notifications.updateNotifications
        }
      });
      
      toast.success('Notifications Updated', {
        description: 'Your notification preferences have been saved.'
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save notifications. Please try again.'
      });
    }
  }, [notifications, saveSettings]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordChange.newPassword || !passwordChange.confirmPassword) {
      toast.error('Error', {
        description: 'Please fill in all password fields.'
      });
      return;
    }

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      toast.error('Error', {
        description: 'New passwords do not match.'
      });
      return;
    }

    if (passwordChange.newPassword.length < 6) {
      toast.error('Error', {
        description: 'Password must be at least 6 characters long.'
      });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordSuccess(false);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordChange.newPassword
      });

      if (error) throw error;

      setPasswordSuccess(true);

      setTimeout(() => {
        setPasswordChange({ newPassword: '', confirmPassword: '' });
        setPasswordSuccess(false);
      }, 3000);

      toast.success('Password Updated', {
        description: 'Your password has been changed successfully.'
      });
    } catch (error: any) {
      setPasswordSuccess(false);
      toast.error('Error', {
        description: error.message || 'Failed to change password. Please try again.'
      });
    } finally {
      setPasswordLoading(false);
    }
  }, [passwordChange]);

  const handleExportData = useCallback(async () => {
    try {
      await exportData();
      toast.success('Data Exported', {
        description: 'Your data has been downloaded successfully.'
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to export data. Please try again.'
      });
    }
  }, [exportData]);

  const toggleNotification = useCallback((key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="settings-options">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2 h-auto">
          <TabsTrigger value="profile" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-2">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-2">
            <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-2">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notify</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-2">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Updates</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-2 col-span-2 sm:col-span-1">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={profile.timezone}
                    onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <select
                    id="currency"
                    value={profile.defaultCurrency}
                    onChange={(e) => setProfile(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Theme</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose your preferred theme
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {THEME_OPTIONS.map((option) => (
                    <ThemeButton
                      key={option.value}
                      {...option}
                      isActive={theme === option.value}
                      onClick={() => handleThemeChange(option.value)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Trading Preferences</Label>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultPositionSize">Default Position Size</Label>
                      <Input
                        id="defaultPositionSize"
                        type="number"
                        value={tradingPrefs.defaultPositionSize}
                        onChange={(e) => setTradingPrefs(prev => ({ 
                          ...prev, 
                          defaultPositionSize: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="riskPerTrade">Risk per Trade (%)</Label>
                      <Input
                        id="riskPerTrade"
                        type="number"
                        value={tradingPrefs.riskPerTrade}
                        onChange={(e) => setTradingPrefs(prev => ({ 
                          ...prev, 
                          riskPerTrade: parseFloat(e.target.value) || 0 
                        }))}
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveTradingPreferences} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Trading Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {NOTIFICATION_OPTIONS.map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">{label}</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {description}
                      </p>
                    </div>
                    <Button
                      variant={notifications[key as keyof typeof notifications] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNotification(key as keyof typeof notifications)}
                    >
                      {notifications[key as keyof typeof notifications] ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notifications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          <UpdateSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-4">Change Password</h4>
                <div className="space-y-4 max-w-md">
                  {passwordSuccess && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <h5 className="font-medium text-green-800 dark:text-green-200">Password Updated Successfully!</h5>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Your password has been changed and is now active.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordChange.newPassword}
                        onChange={(e) => setPasswordChange(prev => ({ 
                          ...prev, 
                          newPassword: e.target.value 
                        }))}
                        placeholder="Enter new password"
                        className={`pr-10 ${passwordSuccess ? 'border-green-300 dark:border-green-700' : ''}`}
                        disabled={passwordLoading || passwordSuccess}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={passwordLoading || passwordSuccess}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordChange.confirmPassword}
                        onChange={(e) => setPasswordChange(prev => ({ 
                          ...prev, 
                          confirmPassword: e.target.value 
                        }))}
                        placeholder="Confirm new password"
                        className={`pr-10 ${passwordSuccess ? 'border-green-300 dark:border-green-700' : ''}`}
                        disabled={passwordLoading || passwordSuccess}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={passwordLoading || passwordSuccess}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordChange.newPassword && (
                    <PasswordStrengthIndicator 
                      password={passwordChange.newPassword}
                      confirmPassword={passwordChange.confirmPassword}
                    />
                  )}

                  <Button 
                    onClick={handleChangePassword} 
                    disabled={passwordLoading || !passwordChange.newPassword || !passwordChange.confirmPassword || passwordSuccess}
                    className={`w-full transition-all duration-200 ${
                      passwordSuccess ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700' : ''
                    }`}
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : passwordSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Password Updated!
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                  
                  {!passwordSuccess && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose a strong password to keep your account secure
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-lg font-medium mb-4">Data Management</h4>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Export Your Data</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download a copy of all your trading data and settings
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-lg font-medium mb-4 text-red-600">Danger Zone</h4>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
                  <div>
                    <h5 className="font-medium text-red-800 dark:text-red-200">Sign Out</h5>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button variant="destructive" onClick={async () => {
                    await signOut();
                    window.location.href = '/';
                  }}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}