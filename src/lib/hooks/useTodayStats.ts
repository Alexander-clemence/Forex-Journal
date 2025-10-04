// lib/hooks/useTodayStats.ts
import { useState, useEffect } from 'react';
import { TradeService } from '@/lib/services/tradeService';
import { Trade } from '@/lib/types/trades';
import { useAuth } from './useAuth';

interface TodayStats {
  todayPnL: number;
  todayTradesCount: number;
  loading: boolean;
  error: string | null;
}

export function useTodayStats(): TodayStats {
  const [stats, setStats] = useState<TodayStats>({
    todayPnL: 0,
    todayTradesCount: 0,
    loading: true,
    error: null
  });

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchTodayStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch trades for today using server-side filtering
        const { trades } = await TradeService.getUserTrades(user.id, {
          date_from: today,
          date_to: today
        });

        // Calculate today's P&L from closed trades
        const todayPnL = trades
          .filter(trade => trade.status === 'closed' && trade.profit_loss !== null)
          .reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

        setStats({
          todayPnL,
          todayTradesCount: trades.length,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching today stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch stats'
        }));
      }
    };

    fetchTodayStats();
    
    // Optional: Refresh stats every 5 minutes
    const interval = setInterval(fetchTodayStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return stats;
}