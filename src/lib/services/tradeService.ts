import { supabase } from '@/lib/supabase/client';
import { Trade, TradeInsert, TradeUpdate, TradeFilters } from '@/lib/types/trades';
import { ProfessionalPipCalculator } from '@/components/lotsizecalculator/LotSizeCalculator';

export class TradeService {
  static async createTrade(trade: TradeInsert): Promise<Trade> {
    // Calculate profit_loss based on status
    const calculatedTrade = {
      ...trade,
      profit_loss: this.calculateProfitLoss(trade),
      risk_reward_ratio: trade.stop_loss && trade.take_profit 
        ? this.calculateRiskRewardRatio(trade.entry_price, trade.stop_loss, trade.take_profit)
        : null
    };

    const { data, error } = await supabase
      .from('trades')
      // @ts-ignore - Type inference issue with returned data
      .insert([calculatedTrade])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTrade(id: string, trade: TradeUpdate): Promise<Trade> {
    // Get existing trade data first
    const { data: existing } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new Error('Trade not found');
    }

    // Merge existing data with updates
    // @ts-ignore - Type inference issue with returned data
    const mergedTrade = { ...existing, ...trade };
    
    // Always recalculate profit_loss based on current status and prices
    const updatedTrade = {
      ...trade,
      profit_loss: this.calculateProfitLoss(mergedTrade),
    };

    // Recalculate risk/reward ratio if relevant fields changed
    // @ts-ignore - Type inference issue with returned data
    if (trade.stop_loss && trade.take_profit && (trade.entry_price || existing.entry_price)) {
      updatedTrade.risk_reward_ratio = this.calculateRiskRewardRatio(
        // @ts-ignore - Type inference issue with returned data
        trade.entry_price || existing.entry_price,
        trade.stop_loss,
        trade.take_profit
      );
    }

    const { data, error } = await supabase
      .from('trades')
      // @ts-ignore - Type inference issue with returned data
      .update(updatedTrade)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTrade(id: string): Promise<void> {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getUserTrades(userId: string, filters?: TradeFilters): Promise<{ trades: Trade[]; total: number }> {
    let query = supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.symbol) {
      query = query.ilike('symbol', `%${filters.symbol}%`);
    }
    
    if (filters?.strategy) {
      query = query.ilike('strategy', `%${filters.strategy}%`);
    }

    if (filters?.side) {
      query = query.eq('side', filters.side);
    }

    if (filters?.mood) {
      query = query.eq('mood', filters.mood);
    }

    if (filters?.market_sentiment) {
      query = query.eq('market_sentiment', filters.market_sentiment);
    }

    if (filters?.performance_rating) {
      query = query.eq('performance_rating', filters.performance_rating);
    }

    if (filters?.date_from) {
      query = query.gte('entry_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('entry_date', filters.date_to);
    }

    if (filters?.min_pnl !== undefined) {
      query = query.gte('profit_loss', filters.min_pnl);
    }

    if (filters?.max_pnl !== undefined) {
      query = query.lte('profit_loss', filters.max_pnl);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { trades: data || [], total: count || 0 };
  }

  static async getTrade(id: string): Promise<Trade | null> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  static async getTradeStats(userId: string): Promise<{
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    totalPnL: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    moodStats: { [key: string]: number };
    avgPerformanceRating: number;
    commonMarketSentiment: string;
  }> {
    const { data, error } = await supabase
      .from('trades')
      .select('status, profit_loss, mood, performance_rating, market_sentiment')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      totalTrades: data.length,
      // @ts-ignore
      openTrades: data.filter(t => t.status === 'open').length,
      // @ts-ignore
      closedTrades: data.filter(t => t.status === 'closed').length,
      // @ts-ignore
      totalPnL: data.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      moodStats: {},
      avgPerformanceRating: 0,
      commonMarketSentiment: ''
    };

    // @ts-ignore
    const closedTrades = data.filter(t => t.status === 'closed' && t.profit_loss !== null && t.profit_loss !== undefined);
    // @ts-ignore
    const winningTrades = closedTrades.filter(t => t.profit_loss > 0);
    // @ts-ignore
    const losingTrades = closedTrades.filter(t => t.profit_loss < 0);

    if (closedTrades.length > 0) {
      stats.winRate = (winningTrades.length / closedTrades.length) * 100;
    }

    if (winningTrades.length > 0) {
      // @ts-ignore
      const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.profit_loss, 0);
      stats.avgWin = totalWinAmount / winningTrades.length;
    }

    if (losingTrades.length > 0) {
      // @ts-ignore
      const totalLossAmount = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit_loss), 0);
      stats.avgLoss = totalLossAmount / losingTrades.length;
    }

    const moodCounts: { [key: string]: number } = {};
    data.forEach(trade => {
      // @ts-ignore
      if (trade.mood) {
        // @ts-ignore
        moodCounts[trade.mood] = (moodCounts[trade.mood] || 0) + 1;
      }
    });
    stats.moodStats = moodCounts;

    // @ts-ignore
    const ratedTrades = data.filter(t => t.performance_rating);
    if (ratedTrades.length > 0) {
      // @ts-ignore
      stats.avgPerformanceRating = ratedTrades.reduce((sum, t) => sum + t.performance_rating, 0) / ratedTrades.length;
    }

    const sentimentCounts: { [key: string]: number } = {};
    data.forEach(trade => {
      // @ts-ignore
      if (trade.market_sentiment) {
        // @ts-ignore
        sentimentCounts[trade.market_sentiment] = (sentimentCounts[trade.market_sentiment] || 0) + 1;
      }
    });
    
    if (Object.keys(sentimentCounts).length > 0) {
      stats.commonMarketSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
        sentimentCounts[a] > sentimentCounts[b] ? a : b
      );
    }

    return stats;
  }

  static async getUserBalance(userId: string): Promise<{
    balance: number;
    realizedPnL: number;
    unrealizedPnL: number;
  }> {
    const { data, error } = await supabase
      .from('trades')
      .select('status, profit_loss')
      .eq('user_id', userId);

    if (error) throw error;
    // @ts-ignore
    const closedTrades = data.filter(t => t.status === 'closed');
    // @ts-ignore
    const openTrades = data.filter(t => t.status === 'open');
    // @ts-ignore
    const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    // @ts-ignore
    const unrealizedPnL = openTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    return {
      balance: realizedPnL,
      realizedPnL,
      unrealizedPnL
    };
  }

  static async getJournalInsights(userId: string): Promise<{
    performanceByMood: { [mood: string]: { avgPnL: number; count: number } };
    performanceBySentiment: { [sentiment: string]: { avgPnL: number; count: number } };
    recentLessons: string[];
  }> {
    const { data, error } = await supabase
      .from('trades')
      .select('mood, market_sentiment, profit_loss, lessons_learned, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'closed')
      .not('profit_loss', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const performanceByMood: { [mood: string]: { totalPnL: number; count: number } } = {};
    const performanceBySentiment: { [sentiment: string]: { totalPnL: number; count: number } } = {};

    data.forEach(trade => {
      // @ts-ignore
      if (trade.mood) {
        // @ts-ignore
        if (!performanceByMood[trade.mood]) {
          // @ts-ignore
          performanceByMood[trade.mood] = { totalPnL: 0, count: 0 };
        }
        // @ts-ignore
        performanceByMood[trade.mood].totalPnL += trade.profit_loss;
        // @ts-ignore
        performanceByMood[trade.mood].count += 1;
      }
      // @ts-ignore
      if (trade.market_sentiment) {
        // @ts-ignore
        if (!performanceBySentiment[trade.market_sentiment]) {
          // @ts-ignore
          performanceBySentiment[trade.market_sentiment] = { totalPnL: 0, count: 0 };
        }
        // @ts-ignore
        performanceBySentiment[trade.market_sentiment].totalPnL += trade.profit_loss;
        // @ts-ignore
        performanceBySentiment[trade.market_sentiment].count += 1;
      }
    });

    const finalMoodData: { [mood: string]: { avgPnL: number; count: number } } = {};
    Object.keys(performanceByMood).forEach(mood => {
      const moodData = performanceByMood[mood];
      finalMoodData[mood] = {
        avgPnL: moodData.totalPnL / moodData.count,
        count: moodData.count
      };
    });

    const finalSentimentData: { [sentiment: string]: { avgPnL: number; count: number } } = {};
    Object.keys(performanceBySentiment).forEach(sentiment => {
      const sentimentData = performanceBySentiment[sentiment];
      finalSentimentData[sentiment] = {
        avgPnL: sentimentData.totalPnL / sentimentData.count,
        count: sentimentData.count
      };
    });

    // @ts-ignore
    const recentLessons = data
      // @ts-ignore
      .filter(trade => trade.lessons_learned && trade.lessons_learned.trim())
      .slice(0, 10)
      // @ts-ignore
      .map(trade => trade.lessons_learned);

    return {
      performanceByMood: finalMoodData,
      performanceBySentiment: finalSentimentData,
      recentLessons
    };
  }

  // FIXED: Calculate P&L using ProfessionalPipCalculator (proper pip value calculation)
  private static calculateProfitLoss(trade: {
    status?: string;
    side: string;
    symbol?: string;
    quantity: number;
    entry_price: number;
    exit_price?: number | null;
    fees?: number | null;
    commission?: number | null;
  }): number {
    if (trade.status !== 'closed' || !trade.exit_price || !trade.symbol) {
      return 0;
    }

    const lotSize = trade.quantity / 100000; // Convert units to standard lots
    const isLong = trade.side === 'buy' || trade.side === 'long';
    
    let grossPnL: number;
    
    if (isLong) {
      // LONG POSITION: Profit when price goes UP
      if (trade.exit_price > trade.entry_price) {
        grossPnL = ProfessionalPipCalculator.calculatePotentialProfit(
          trade.symbol, 
          lotSize, 
          trade.entry_price, 
          trade.exit_price
        );
      } else {
        grossPnL = -ProfessionalPipCalculator.calculateRiskAmount(
          trade.symbol, 
          lotSize, 
          trade.entry_price, 
          trade.exit_price
        );
      }
    } else {
      // SHORT POSITION: Profit when price goes DOWN
      if (trade.exit_price < trade.entry_price) {
        grossPnL = ProfessionalPipCalculator.calculatePotentialProfit(
          trade.symbol, 
          lotSize, 
          trade.exit_price,
          trade.entry_price
        );
      } else {
        grossPnL = -ProfessionalPipCalculator.calculateRiskAmount(
          trade.symbol, 
          lotSize, 
          trade.exit_price,
          trade.entry_price
        );
      }
    }

    const totalCosts = (trade.fees || 0) + (trade.commission || 0);
    return grossPnL - totalCosts;
  }

  private static calculateRiskRewardRatio(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    return risk > 0 ? reward / risk : 0;
  }
}