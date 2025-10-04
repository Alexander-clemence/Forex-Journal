import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SimpleBalanceService } from '@/lib/services/accountService';

interface BalanceData {
  currentBalance: number;
  baseBalance: number;
  tradePnL: number;
  hasBalance: boolean;
  loading: boolean;
  error: string | null;
}

export function useSimpleBalance() {
  const [data, setData] = useState<BalanceData>({
    currentBalance: 0,
    baseBalance: 0,
    tradePnL: 0,
    hasBalance: false,
    loading: true,
    error: null
  });

  const fetchBalance = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get balance with trades included
      const balanceData = await SimpleBalanceService.getBalanceWithTrades(user.id);
      
      setData({
        currentBalance: balanceData.balance,
        baseBalance: balanceData.baseBalance,
        tradePnL: balanceData.tradePnL,
        hasBalance: balanceData.hasBalance,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Balance fetch error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const setBalance = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // This sets the base balance - trade P&L will be added automatically
    await SimpleBalanceService.setBalance(user.id, amount);
    
    // Refresh data after update
    await fetchBalance();
  };

  const createBalance = async (initialAmount: number = 0) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await SimpleBalanceService.createBalance(user.id, initialAmount);
    
    // Refresh data after creation
    await fetchBalance();
  };

  const getOrCreateBalance = async (initialAmount: number = 0) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await SimpleBalanceService.getOrCreateBalance(user.id, initialAmount);
    
    // Refresh data after operation
    await fetchBalance();
  };

  // Backward compatibility - both method names work
  const setStartingBalance = setBalance;

  const refresh = async () => {
    await fetchBalance();
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return {
    currentBalance: data.currentBalance,  // Base balance + trade P&L
    baseBalance: data.baseBalance,        // Just the manually set balance
    tradePnL: data.tradePnL,             // P&L from closed trades
    hasBalance: data.hasBalance,
    loading: data.loading,
    error: data.error,
    setBalance,
    setStartingBalance, // Backward compatibility
    createBalance,
    getOrCreateBalance,
    refresh
  };
}