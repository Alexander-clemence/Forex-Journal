import { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];

export type Strategy = Database['public']['Tables']['strategies']['Row'];
export type StrategyInsert = Database['public']['Tables']['strategies']['Insert'];
export type StrategyUpdate = Database['public']['Tables']['strategies']['Update'];

export type WatchlistItem = Database['public']['Tables']['watchlist']['Row'];
export type WatchlistInsert = Database['public']['Tables']['watchlist']['Insert'];
export type WatchlistUpdate = Database['public']['Tables']['watchlist']['Update'];

export type Mood = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface AuthFormData {
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  display_name: string;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface UserSettings {
  timezone: string;
  default_currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email_daily_summary: boolean;
    email_trade_reminders: boolean;
    push_notifications: boolean;
  };
  trading_preferences: {
    default_position_size: number;
    risk_per_trade: number;
    preferred_timeframes: string[];
  };
}