import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';
import { TradeService } from './tradeService';

type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];
type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];

// Helper to get supabase client without type checking (avoids schema cache issues)
const getSettingsTable = () => {
  return (supabase as any).from('user_settings');
};

// Compatibility interface for components (maps new schema to old format)
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

// Helper to convert new schema to compatibility format
function adaptSettingsFromDB(dbSettings: UserSettingsRow | null, userId: string): UserSettings {
  if (!dbSettings) {
    return getDefaultSettings(userId);
  }

  // Theme is stored directly as text
  const theme: 'light' | 'dark' | 'system' = 
    (dbSettings.theme === 'light' || dbSettings.theme === 'dark' || dbSettings.theme === 'system')
      ? dbSettings.theme
      : 'system';

  // Parse JSON fields
  const notifications = dbSettings.notifications && typeof dbSettings.notifications === 'object'
    ? {
        daily_summary: (dbSettings.notifications as any).daily_summary ?? true,
        trade_reminders: (dbSettings.notifications as any).trade_reminders ?? false,
        update_notifications: (dbSettings.notifications as any).update_notifications ?? true,
      }
    : {
        daily_summary: true,
        trade_reminders: false,
        update_notifications: true,
      };

  const trading_preferences = dbSettings.trading_preferences && typeof dbSettings.trading_preferences === 'object'
    ? {
        default_position_size: (dbSettings.trading_preferences as any).default_position_size ?? 1000,
        risk_per_trade: (dbSettings.trading_preferences as any).risk_per_trade ?? 2,
      }
    : {
        default_position_size: 1000,
        risk_per_trade: 2,
      };

  return {
    id: dbSettings.id,
    user_id: dbSettings.user_id,
    display_name: dbSettings.display_name || undefined,
    timezone: dbSettings.timezone || 'UTC',
    default_currency: dbSettings.default_currency || 'USD',
    theme,
    notifications,
    trading_preferences,
  };
}

// Helper to convert compatibility format to new schema
function adaptSettingsToDB(settings: Partial<UserSettings>): Partial<UserSettingsInsert> {
  const result: Partial<UserSettingsInsert> = {};

  if (settings.theme !== undefined) {
    result.theme = settings.theme;
  }
  if (settings.default_currency !== undefined) {
    result.default_currency = settings.default_currency;
  }
  if (settings.timezone !== undefined) {
    result.timezone = settings.timezone;
  }
  if (settings.display_name !== undefined) {
    result.display_name = settings.display_name || null;
  }
  if (settings.notifications !== undefined) {
    result.notifications = settings.notifications as any;
  }
  if (settings.trading_preferences !== undefined) {
    result.trading_preferences = settings.trading_preferences as any;
  }

  return result;
}

function getDefaultSettings(userId: string): UserSettings {
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

export class SettingsService {
  static async getUserSettings(userId: string): Promise<UserSettings> {
    // Use untyped client to avoid schema cache issues with dark_mode
    const { data, error } = await getSettingsTable()
      .select('id, user_id, display_name, timezone, default_currency, theme, notifications, trading_preferences, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user settings:', error);
      throw new Error(error.message || 'Failed to fetch user settings');
    }

    // Always return settings (default if not found)
    return adaptSettingsFromDB(data, userId);
  }

  static async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    if (!settings.user_id) {
      throw new Error('user_id is required to save settings');
    }

    // Build payload manually to avoid any schema cache issues with dark_mode
    const payload: any = {
      user_id: settings.user_id,
      updated_at: new Date().toISOString(),
    };

    // Only include fields that exist in the actual database schema
    if (settings.theme !== undefined) {
      payload.theme = settings.theme;
    }
    if (settings.default_currency !== undefined) {
      payload.default_currency = settings.default_currency;
    }
    if (settings.timezone !== undefined) {
      payload.timezone = settings.timezone;
    }
    if (settings.display_name !== undefined) {
      payload.display_name = settings.display_name || null;
    }
    if (settings.notifications !== undefined) {
      payload.notifications = settings.notifications;
    }
    if (settings.trading_preferences !== undefined) {
      payload.trading_preferences = settings.trading_preferences;
    }
    
    // Use untyped client to avoid schema cache issues with dark_mode
    const { data, error } = await getSettingsTable()
      .upsert(payload, {
        onConflict: 'user_id'
      })
      .select('id, user_id, display_name, timezone, default_currency, theme, notifications, trading_preferences, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase error saving settings:', error);
      throw new Error(error.message || 'Failed to save settings to database');
    }
    
    return adaptSettingsFromDB(data, settings.user_id);
  }

  static async updateTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      // Try RPC function first (if it exists) to bypass schema validation
      const { error: rpcError } = await (supabase as any).rpc('update_user_theme', {
        p_user_id: userId,
        p_theme: theme,
      });

      // If RPC works, we're done
      if (!rpcError) {
        return;
      }

      // Fallback: Direct update using raw client to avoid schema cache
      // Use a completely untyped approach
      const client = supabase as any;
      const table = client.from('user_settings');
      
      // Try to update existing record
      const { error: updateError } = await table
        .update({ theme: theme })
        .eq('user_id', userId);

      if (updateError) {
        // If no record exists, create one
        // Check if error is "no rows" or similar
        const isNotFound = updateError.code === 'PGRST116' || 
                          updateError.message?.includes('No rows') ||
                          updateError.message?.includes('not found');

        if (isNotFound) {
          const { error: insertError } = await table.insert({
            user_id: userId,
            theme: theme,
            timezone: 'UTC',
            default_currency: 'USD',
          });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to create theme setting: ${insertError.message || insertError.code}`);
          }
        } else {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update theme: ${updateError.message || updateError.code}`);
        }
      }
    } catch (err) {
      console.error('Error in updateTheme:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Failed to update theme: Unknown error');
    }
  }

  static async updateUserProfile(userId: string, profile: { display_name?: string }): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      data: { display_name: profile.display_name }
    });

    if (error) throw error;
    
    // Note: display_name is not in new user_settings schema, only in auth
    // If needed, could store in profiles table
  }

  static getDefaultSettings(userId: string): UserSettings {
    return getDefaultSettings(userId);
  }

  static async exportUserData(userId: string): Promise<Blob> {
    // Get all user data
    const [settings, tradesResult] = await Promise.all([
      this.getUserSettings(userId),
      TradeService.getUserTrades(userId)
    ]);

    const exportData = {
      settings,
      trades: tradesResult.trades,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  }
}