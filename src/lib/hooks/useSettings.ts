'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SettingsService, UserSettings } from '@/lib/services/settingsService';
import { useTheme } from '@/components/theme/ThemeProvider';

export function useSettings() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const userSettings = await SettingsService.getUserSettings(user.id);
      setSettings(userSettings);
      
      // Apply theme from settings
      if (userSettings?.theme) {
        setTheme(userSettings.theme);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      // Set default settings on error so the app can still function
      const defaultSettings = SettingsService.getDefaultSettings(user.id);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user?.id) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setSaving(true);
      setError(null);

      // Get current settings or use defaults
      const currentSettings = settings || SettingsService.getDefaultSettings(user.id);

      const updatedSettings = {
        ...currentSettings,
        ...newSettings,
        user_id: user.id
      };

      const savedSettings = await SettingsService.saveUserSettings(updatedSettings);
      setSettings(savedSettings);

      // Apply theme if it was changed
      if (newSettings.theme) {
        setTheme(newSettings.theme);
      }

      return savedSettings;
    } catch (err) {
      console.error('Error saving settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async (profile: { display_name?: string }) => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);

      await SettingsService.updateUserProfile(user.id, profile);
      
      // Reload settings to get updated data
      await loadSettings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    if (!user?.id) return;

    try {
      const blob = await SettingsService.exportUserData(user.id);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-journal-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
    updateProfile,
    exportData,
    refetch: loadSettings
  };
}