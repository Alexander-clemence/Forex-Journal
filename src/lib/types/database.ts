export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Auth types for Supabase Admin API
export interface AuthUser {
  id: string
  aud: string
  role?: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: {
    provider?: string
    providers?: string[]
    [key: string]: any
  }
  user_metadata: {
    [key: string]: any
  }
  identities?: Array<{
    id: string
    user_id: string
    identity_data?: {
      [key: string]: any
    }
    provider: string
    created_at?: string
    last_sign_in_at?: string
    updated_at?: string
  }>
  created_at: string
  updated_at?: string
  banned_until?: string
  deleted_at?: string
}

export interface AuthResponse {
  users: AuthUser[]
}

// Extended Profile type that includes email from auth
export type ProfileWithEmail = Database['public']['Tables']['profiles']['Row'] & { 
  email?: string 
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: string | null
          username: string | null
          display_name: string | null
          avatar_url: string | null
          timezone: string | null
          default_currency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string | null
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          default_currency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string | null
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string | null
          default_currency?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell' | 'long' | 'short'
          quantity: number
          entry_price: number
          exit_price: number | null
          entry_date: string
          exit_date: string | null
          status: 'open' | 'closed' | 'cancelled'
          profit_loss: number | null
          fees: number | null
          commission: number | null
          strategy: string | null
          setup: string | null
          notes: string | null
          tags: string[] | null
          stop_loss: number | null
          take_profit: number | null
          risk_reward_ratio: number | null
          mood: string | null
          market_sentiment: string | null
          market_notes: string | null
          lessons_learned: string | null
          trade_analysis: string | null
          emotional_state: string | null
          pre_trade_plan: string | null
          post_trade_review: string | null
          performance_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell' | 'long' | 'short'
          quantity: number
          entry_price: number
          exit_price?: number | null
          entry_date: string
          exit_date?: string | null
          status?: 'open' | 'closed' | 'cancelled'
          profit_loss?: number | null
          fees?: number | null
          commission?: number | null
          strategy?: string | null
          setup?: string | null
          notes?: string | null
          tags?: string[] | null
          stop_loss?: number | null
          take_profit?: number | null
          risk_reward_ratio?: number | null
          mood?: string | null
          market_sentiment?: string | null
          market_notes?: string | null
          lessons_learned?: string | null
          trade_analysis?: string | null
          emotional_state?: string | null
          pre_trade_plan?: string | null
          post_trade_review?: string | null
          performance_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          side?: 'buy' | 'sell' | 'long' | 'short'
          quantity?: number
          entry_price?: number
          exit_price?: number | null
          entry_date?: string
          exit_date?: string | null
          status?: 'open' | 'closed' | 'cancelled'
          profit_loss?: number | null
          fees?: number | null
          commission?: number | null
          strategy?: string | null
          setup?: string | null
          notes?: string | null
          tags?: string[] | null
          stop_loss?: number | null
          take_profit?: number | null
          risk_reward_ratio?: number | null
          mood?: string | null
          market_sentiment?: string | null
          market_notes?: string | null
          lessons_learned?: string | null
          trade_analysis?: string | null
          emotional_state?: string | null
          pre_trade_plan?: string | null
          post_trade_review?: string | null
          performance_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          entry_date: string
          title: string | null
          content: string | null
          mood: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | null
          market_sentiment: string | null
          market_notes: string | null
          daily_pnl: number | null
          lessons_learned: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entry_date: string
          title?: string | null
          content?: string | null
          mood?: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | null
          market_sentiment?: string | null
          market_notes?: string | null
          daily_pnl?: number | null
          lessons_learned?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entry_date?: string
          title?: string | null
          content?: string | null
          mood?: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' | null
          market_sentiment?: string | null
          market_notes?: string | null
          daily_pnl?: number | null
          lessons_learned?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          rules: string | null
          win_rate: number | null
          avg_profit: number | null
          avg_loss: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          rules?: string | null
          win_rate?: number | null
          avg_profit?: number | null
          avg_loss?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          rules?: string | null
          win_rate?: number | null
          avg_profit?: number | null
          avg_loss?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          symbol: string
          notes: string | null
          target_price: number | null
          alert_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          notes?: string | null
          target_price?: number | null
          alert_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          notes?: string | null
          target_price?: number | null
          alert_price?: number | null
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role: string
          permission: string
          created_at: string
        }
        Insert: {
          id?: string
          role: string
          permission: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          permission?: string
          created_at?: string
        }
      }
      user_balances: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}