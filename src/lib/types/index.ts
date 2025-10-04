// Re-export all types for easier importing
export * from './database';
export * from './trades';
export * from './usertypes';

// Common utility types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

// Chart/Analytics types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PnLChartData {
  date: string;
  daily_pnl: number;
  cumulative_pnl: number;
  trade_count: number;
}

export interface PerformanceMetrics {
  total_return: number;
  total_return_percentage: number;
  win_rate: number;
  profit_factor: number;
  sharpe_ratio: number;
  max_drawdown: number;
  avg_trade_duration: number;
  best_month: {
    month: string;
    pnl: number;
  };
  worst_month: {
    month: string;
    pnl: number;
  };
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | string[];
}