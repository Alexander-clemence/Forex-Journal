import { supabase } from '@/lib/supabase/client';

export interface UserSettings {
  id?: string;
  user_id: string;
  display_name?: string;
  timezone: string;
  default_currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    daily_summary: boolean;
    trade_reminders: boolean;
    update_notifications: boolean;
  };
  trading_preferences: {
    default_position_size?: number;
    risk_per_trade?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export class SettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return this.getDefaultSettings(userId);
      }
      throw error;
    }

    return data;
  }

  static async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      // @ts-ignore - Type inference issue with returned data
      .upsert({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUserProfile(userId: string, profile: { display_name?: string }): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: profile.display_name }
    });

    if (error) throw error;

    // Also update in user_settings table
    await supabase
      .from('user_settings')
      // @ts-ignore - Type inference issue with returned data
      .upsert({
        user_id: userId,
        display_name: profile.display_name,
        updated_at: new Date().toISOString()
      });
  }

  static getDefaultSettings(userId: string): UserSettings {
    return {
      user_id: userId,
      timezone: 'UTC',
      default_currency: 'USD',
      theme: 'system',
      notifications: {
        daily_summary: true,
        trade_reminders: false,
        update_notifications: true
      },
      trading_preferences: {
        default_position_size: 1000,
        risk_per_trade: 2
      }
    };
  }

  static async exportUserData(userId: string): Promise<Blob> {
    // Get all user data
    const [settings, trades] = await Promise.all([
      this.getUserSettings(userId),
      supabase.from('trades').select('*').eq('user_id', userId)
    ]);

    const exportData = {
      settings,
      trades: trades.data,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  }
}