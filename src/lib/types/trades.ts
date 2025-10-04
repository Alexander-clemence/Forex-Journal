// lib/types/trades.ts - Extended TradeFilters for journal features
import { Database } from './database';

export type Trade = Database['public']['Tables']['trades']['Row'];
export type TradeInsert = Database['public']['Tables']['trades']['Insert'];
export type TradeUpdate = Database['public']['Tables']['trades']['Update'];
export type TradeSide = 'buy' | 'sell' | 'long' | 'short';
export type TradeStatus = 'open' | 'closed' | 'cancelled';

export interface TradeFormData {
  symbol: string;
  side: TradeSide;
  quantity: number;
  entry_price: number;
  exit_price?: number;
  entry_date: string;
  exit_date?: string;
  strategy?: string;
  setup?: string;
  notes?: string;
  tags?: string[];
  stop_loss?: number;
  take_profit?: number;
  fees?: number;
  commission?: number;
  // Journal fields
  mood?: string;
  market_sentiment?: string;
  market_notes?: string;
  lessons_learned?: string;
  trade_analysis?: string;
  emotional_state?: string;
  pre_trade_plan?: string;
  post_trade_review?: string;
  performance_rating?: number;
}

export interface TradeWithCalculations extends Trade {
  profit_loss_percentage?: number;
  days_held?: number;
  risk_reward_actual?: number;
}

export interface TradeStats {
  total_trades: number;
  open_trades: number;
  closed_trades: number;
  total_pnl: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  best_trade: number;
  worst_trade: number;
  profit_factor: number;
  sharpe_ratio?: number;
}

// Extended TradeFilters to include journal features
export interface TradeFilters {
  symbol?: string;
  side?: TradeSide;
  status?: TradeStatus;
  strategy?: string;
  date_from?: string;
  date_to?: string;
  min_pnl?: number;
  max_pnl?: number;
  // New journal filters
  mood?: string;
  market_sentiment?: string;
  performance_rating?: number;
}

export interface TradeSortOptions {
  field: keyof Trade;
  direction: 'asc' | 'desc';
}