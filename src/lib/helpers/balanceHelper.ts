// Create this as /lib/helpers/balanceHelper.ts
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';

// Use the Trade type from your database
type Trade = Database['public']['Tables']['trades']['Row'];

export interface UserBalance {
  balance: number;
  realizedPnL: number;
  unrealizedPnL: number;
  openTrades: number;
  closedTrades: number;
}

export class BalanceHelper {
  /**
   * Calculate user balance from trade P&L
   * No more user_balances table needed - everything computed from trades
   */
  static async getUserBalance(userId: string): Promise<UserBalance> {
    const { data: trades, error } = await supabase
      .from('trades')
      .select('status, profit_loss')
      .eq('user_id', userId);

    if (error) throw error;

    // Explicitly type the trades array to avoid 'never' type
    const tradesArray: Pick<Trade, 'status' | 'profit_loss'>[] = trades || [];

    const closedTrades = tradesArray.filter(t => t.status === 'closed');
    const openTrades = tradesArray.filter(t => t.status === 'open');

    // Sum P&L from closed trades (realized P&L)
    const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
   
    // Open trades should have profit_loss = 0, but just in case
    const unrealizedPnL = openTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    return {
      balance: realizedPnL, // Total account balance is just realized P&L
      realizedPnL,
      unrealizedPnL,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length
    };
  }

  /**
   * Get balance history by date (optional enhancement)
   */
  static async getBalanceHistory(userId: string, days: number = 30): Promise<Array<{
    date: string;
    balance: number;
    dailyPnL: number;
  }>> {
    const { data: trades, error } = await supabase
      .from('trades')
      .select('exit_date, profit_loss, status')
      .eq('user_id', userId)
      .eq('status', 'closed')
      .not('exit_date', 'is', null)
      .order('exit_date', { ascending: true });

    if (error) throw error;

    // Explicitly type the trades array
    const tradesArray: Pick<Trade, 'exit_date' | 'profit_loss' | 'status'>[] = trades || [];

    const history: { [key: string]: number } = {};
    let runningBalance = 0;

    // Group trades by exit date and calculate cumulative balance
    tradesArray.forEach(trade => {
      if (trade.exit_date && trade.profit_loss !== null) {
        const date = trade.exit_date.split('T')[0];
        if (!history[date]) {
          history[date] = 0;
        }
        history[date] += trade.profit_loss;
      }
    });

    // Convert to array format with cumulative balance
    const result = Object.entries(history).map(([date, dailyPnL]) => {
      runningBalance += dailyPnL;
      return {
        date,
        balance: runningBalance,
        dailyPnL
      };
    });

    return result;
  }
}