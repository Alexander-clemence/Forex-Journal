import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/types/database';

type UserBalance = Database['public']['Tables']['user_balances']['Row'];
type Trade = Database['public']['Tables']['trades']['Row'];

export class SimpleBalanceService {
  /**
   * Get user's current balance including trade P&L
   */
  static async getBalanceWithTrades(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get base balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      // Type the balance data
      const typedBalanceData = balanceData as Pick<UserBalance, 'balance' | 'created_at' | 'updated_at'> | null;

      // Get trade P&L
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('profit_loss, status')
        .eq('user_id', user.id)
        .eq('status', 'closed');

      if (tradesError) {
        throw tradesError;
      }

      // Type the trades data
      const typedTrades = trades as Pick<Trade, 'profit_loss' | 'status'>[] | null;

      const baseBalance = typedBalanceData?.balance || 0;
      const tradePnL = typedTrades?.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0) || 0;
      const currentBalance = baseBalance + tradePnL;

      return {
        balance: currentBalance,
        baseBalance, // The manually set balance
        tradePnL,    // P&L from closed trades
        hasBalance: !!typedBalanceData,
        created_at: typedBalanceData?.created_at,
        updated_at: typedBalanceData?.updated_at
      };
    } catch (error) {
      console.error('Error in getBalanceWithTrades:', error);
      throw error;
    }
  }

  /**
   * Get user's base balance (without trade P&L)
   */
  static async getBalance(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_balances')
        .select('balance, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Type the balance data
      const typedData = data as Pick<UserBalance, 'balance' | 'created_at' | 'updated_at'> | null;

      return {
        balance: typedData?.balance || 0,
        hasBalance: !!typedData,
        created_at: typedData?.created_at,
        updated_at: typedData?.updated_at
      };
    } catch (error) {
      console.error('Error in getBalance:', error);
      throw error;
    }
  }

  /**
   * Set/Update user balance - only updates existing records
   */
  static async setBalance(userId: string, amount: number) {
    try {
      console.log('setBalance called with userId:', userId, 'amount:', amount);
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      console.log('Authenticated user ID:', user.id);
      console.log('Passed userId parameter:', userId);
      console.log('User IDs match:', user.id === userId);
      
      // @ts-ignore - Supabase type inference issue, works correctly at runtime
      const { data, error } = await supabase
        .from('user_balances')
        // @ts-ignore
        .update({ 
          balance: amount, 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .select();
      
      console.log('Update result:', { data, error });
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No balance record found to update. Please create a balance record first.');
      }
      
      console.log('Balance updated successfully:', data[0]);
      return data[0];
      
    } catch (error) {
      console.error('Error in setBalance:', error);
      throw error;
    }
  }

  /**
   * Create initial balance record for new users
   */
  static async createBalance(userId: string, initialAmount: number = 0) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // @ts-ignore - Supabase type inference issue, works correctly at runtime
      const { data, error } = await supabase
        .from('user_balances')
        // @ts-ignore
        .insert({
          user_id: user.id,
          balance: initialAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error in createBalance:', error);
      throw error;
    }
  }

  /**
   * Get or create balance for user
   */
  static async getOrCreateBalance(userId: string, initialAmount: number = 0) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Try to get existing balance
      const balanceData = await this.getBalance(user.id);
      
      if (balanceData.hasBalance) {
        return balanceData;
      }
      
      // Create new balance record
      const newBalance = await this.createBalance(user.id, initialAmount);
      // @ts-ignore - Type inference issue with returned data
      return {
        // @ts-ignore - Type inference issue with returned data
        balance: newBalance.balance,
        hasBalance: true,
        // @ts-ignore - Type inference issue with returned data
        created_at: newBalance.created_at,
        // @ts-ignore - Type inference issue with returned data
        updated_at: newBalance.updated_at
      };
      
    } catch (error) {
      console.error('Error in getOrCreateBalance:', error);
      throw error;
    }
  }

  /**
   * Check if user has a balance record
   */
  static async hasBalanceRecord(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_balances')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasBalanceRecord:', error);
      return false;
    }
  }

  /**
   * Delete user balance record
   */
  static async deleteBalance(userId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_balances')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error in deleteBalance:', error);
      throw error;
    }
  }
}