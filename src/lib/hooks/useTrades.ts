'use client';

import { useState, useEffect } from 'react';
import { db, subscriptions } from '@/lib/supabase/client';
import { Trade, TradeInsert, TradeUpdate } from '@/lib/types/trades';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all trades
  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.trades.getAll();
      
      if (error) {
        setError(error.message);
      } else {
        setTrades(data || []);
      }
    } catch (err) {
      setError('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  // Create new trade
  const createTrade = async (tradeData: TradeInsert) => {
    try {
      const { data, error } = await db.trades.create(tradeData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        setTrades(prev => [data, ...prev]);
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create trade';
      return { data: null, error };
    }
  };

  // Update trade
  const updateTrade = async (id: string, updates: TradeUpdate) => {
    try {
      const { data, error } = await db.trades.update(id, updates);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        setTrades(prev => prev.map(trade => 
          trade.id === id ? data : trade
        ));
      }
      
      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update trade';
      return { data: null, error };
    }
  };

  // Delete trade
  const deleteTrade = async (id: string) => {
    try {
      const { error } = await db.trades.delete(id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setTrades(prev => prev.filter(trade => trade.id !== id));
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete trade';
      return { error };
    }
  };

  // Get single trade
  const getTrade = async (id: string) => {
    try {
      const { data, error } = await db.trades.getById(id);
      return { data, error };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch trade';
      return { data: null, error };
    }
  };

  // Calculate stats
  const getStats = () => {
    const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.profit_loss !== null);
    const openTrades = trades.filter(trade => trade.status === 'open');
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.profit_loss || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.profit_loss || 0) < 0);
    
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    // Average win calculation (already correct - positive numbers)
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0) / winningTrades.length 
      : 0;
    
    // Average loss calculation - use Math.abs() to return positive number
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, trade) => sum + Math.abs(trade.profit_loss || 0), 0) / losingTrades.length 
      : 0;
    
    // FIXED: Best trade = highest positive value (only from winning trades)
    const bestTrade = winningTrades.length > 0 
      ? Math.max(...winningTrades.map(trade => trade.profit_loss || 0))
      : 0;
    
    // FIXED: Worst trade = most negative value (only from losing trades)
    const worstTrade = losingTrades.length > 0
      ? Math.min(...losingTrades.map(trade => trade.profit_loss || 0))
      : 0;

    // Calculate today's P&L
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = closedTrades.filter(trade => {
      const tradeDate = trade.exit_date || trade.entry_date;
      return tradeDate && tradeDate.split('T')[0] === today;
    });
    const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

    return {
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      totalPnL,
      winRate,
      avgWin,
      avgLoss, // Returns positive number (e.g., 45.50)
      bestTrade, // Returns 0 if no winning trades
      worstTrade, // Returns 0 if no losing trades, otherwise negative number
      todayPnL,
      winCount: winningTrades.length,
      lossCount: losingTrades.length
    };
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchTrades();

    // Subscribe to real-time changes
    const channel = subscriptions.trades((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          setTrades(prev => [newRecord, ...prev]);
          break;
        case 'UPDATE':
          setTrades(prev => prev.map(trade => 
            trade.id === newRecord.id ? newRecord : trade
          ));
          break;
        case 'DELETE':
          setTrades(prev => prev.filter(trade => trade.id !== oldRecord.id));
          break;
      }
    });

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    trades,
    loading,
    error,
    createTrade,
    updateTrade,
    deleteTrade,
    getTrade,
    refreshTrades: fetchTrades,
    stats: getStats()
  };
}