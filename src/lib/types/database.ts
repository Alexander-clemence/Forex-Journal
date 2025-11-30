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
          username: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
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
          strategy_id: string | null
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
          strategy_id?: string | null
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
          strategy_id?: string | null
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
      trade_metrics: {
        Row: {
          id: string
          trade_id: string
          risk_reward_ratio: number | null
          max_loss: number | null
          max_gain: number | null
          win_prob: number | null
          loss_prob: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          risk_reward_ratio?: number | null
          max_loss?: number | null
          max_gain?: number | null
          win_prob?: number | null
          loss_prob?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          risk_reward_ratio?: number | null
          max_loss?: number | null
          max_gain?: number | null
          win_prob?: number | null
          loss_prob?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trade_reviews: {
        Row: {
          id: string
          trade_id: string
          market_analysis: string | null
          lesson_learned: string | null
          setup_grade: string | null
          emotional_state: string | null
          pre_trade_plan: string | null
          post_trade_review: string | null
          performance_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trade_id: string
          market_analysis?: string | null
          lesson_learned?: string | null
          setup_grade?: string | null
          emotional_state?: string | null
          pre_trade_plan?: string | null
          post_trade_review?: string | null
          performance_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trade_id?: string
          market_analysis?: string | null
          lesson_learned?: string | null
          setup_grade?: string | null
          emotional_state?: string | null
          pre_trade_plan?: string | null
          post_trade_review?: string | null
          performance_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      balance_transactions: {
        Row: {
          id: string
          user_id: string
          trade_id: string | null
          amount: number
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trade_id?: string | null
          amount: number
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trade_id?: string | null
          amount?: number
          type?: string
          created_at?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          asset: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          timezone: string | null
          default_currency: string | null
          theme: string | null
          notifications: Json | null
          trading_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          timezone?: string | null
          default_currency?: string | null
          theme?: string | null
          notifications?: Json | null
          trading_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          timezone?: string | null
          default_currency?: string | null
          theme?: string | null
          notifications?: Json | null
          trading_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          performed_by: string
          target_user_id: string | null
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          performed_by: string
          target_user_id?: string | null
          action: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          performed_by?: string
          target_user_id?: string | null
          action?: string
          metadata?: Json | null
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
      subscription_plans: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          price: number
          currency: string
          billing_period: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          price: number
          currency: string
          billing_period?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          billing_period?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          starts_at: string
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: string
          starts_at: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          starts_at?: string
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          amount: number
          currency: string
          provider: string
          status: string
          transaction_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          amount: number
          currency: string
          provider: string
          status: string
          transaction_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          amount?: number
          currency?: string
          provider?: string
          status?: string
          transaction_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      trade_full_view: {
        Row: {
          // All original trades columns
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
          strategy_id: string | null
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
          // Prefixed columns from trade_metrics
          metrics_risk_reward_ratio: number | null
          metrics_max_loss: number | null
          metrics_max_gain: number | null
          metrics_win_prob: number | null
          metrics_loss_prob: number | null
          metrics_notes: string | null
          metrics_created_at: string | null
          metrics_updated_at: string | null
          // Columns from trade_reviews
          review_market_analysis: string | null
          review_lesson_learned: string | null
          review_setup_grade: string | null
          review_emotional_state: string | null
          review_pre_trade_plan: string | null
          review_post_trade_review: string | null
          review_performance_rating: number | null
          review_created_at: string | null
          review_updated_at: string | null
        }
      }
      profile_full: {
        Row: {
          // All profiles columns
          id: string
          username: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          // All user_settings columns (merged with profiles)
          display_name: string | null
          timezone: string | null
          default_currency: string | null
          theme: 'light' | 'dark' | 'system' | null
          notifications: Json | null
          trading_preferences: Json | null
          settings_updated_at: string | null
        }
      }
    }
    Views: {
      profile_with_subscription: {
        Row: {
          // All profiles columns
          id: string
          username: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          // Subscription info
          plan_code: string | null
          plan_name: string | null
          subscription_status: string | null
          subscription_starts_at: string | null
          subscription_ends_at: string | null
        }
      }
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