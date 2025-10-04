import { supabase } from '@/lib/supabase/client';
import { Trade, TradeInsert, TradeUpdate, TradeFilters } from '@/lib/types/trades';

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
    // New journal-related stats
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
              // @ts-ignore - Type inference issue with returned data
      openTrades: data.filter(t => t.status === 'open').length,
              // @ts-ignore - Type inference issue with returned data
      closedTrades: data.filter(t => t.status === 'closed').length,
              // @ts-ignore - Type inference issue with returned data
      totalPnL: data.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      moodStats: {},
      avgPerformanceRating: 0,
      commonMarketSentiment: ''
    };

    // Calculate win/loss stats
            // @ts-ignore - Type inference issue with returned data
    const closedTrades = data.filter(t => t.status === 'closed' && t.profit_loss !== null && t.profit_loss !== undefined);
            // @ts-ignore - Type inference issue with returned data
    const winningTrades = closedTrades.filter(t => t.profit_loss > 0);
            // @ts-ignore - Type inference issue with returned data
    const losingTrades = closedTrades.filter(t => t.profit_loss < 0);

    if (closedTrades.length > 0) {
      stats.winRate = (winningTrades.length / closedTrades.length) * 100;
    }

    if (winningTrades.length > 0) {
              // @ts-ignore - Type inference issue with returned data
      const totalWinAmount = winningTrades.reduce((sum, t) => sum + t.profit_loss, 0);
      stats.avgWin = totalWinAmount / winningTrades.length;
    }

    if (losingTrades.length > 0) {
              // @ts-ignore - Type inference issue with returned data
      const totalLossAmount = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit_loss), 0);
      stats.avgLoss = totalLossAmount / losingTrades.length;
    }

    // Calculate mood stats
    const moodCounts: { [key: string]: number } = {};
    data.forEach(trade => {
              // @ts-ignore - Type inference issue with returned data
      if (trade.mood) {
                // @ts-ignore - Type inference issue with returned data
        moodCounts[trade.mood] = (moodCounts[trade.mood] || 0) + 1;
      }
    });
    stats.moodStats = moodCounts;

    // Calculate average performance rating
            // @ts-ignore - Type inference issue with returned data
    const ratedTrades = data.filter(t => t.performance_rating);
    if (ratedTrades.length > 0) {
              // @ts-ignore - Type inference issue with returned data
      stats.avgPerformanceRating = ratedTrades.reduce((sum, t) => sum + t.performance_rating, 0) / ratedTrades.length;
    }

    // Find most common market sentiment
    const sentimentCounts: { [key: string]: number } = {};
    data.forEach(trade => {
              // @ts-ignore - Type inference issue with returned data
      if (trade.market_sentiment) {
                // @ts-ignore - Type inference issue with returned data
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

  // Get user balance by summing all closed trade P&L
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
        // @ts-ignore - Type inference issue with returned data
    const closedTrades = data.filter(t => t.status === 'closed');
            // @ts-ignore - Type inference issue with returned data
    const openTrades = data.filter(t => t.status === 'open');
        // @ts-ignore - Type inference issue with returned data
    const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
            // @ts-ignore - Type inference issue with returned data
    const unrealizedPnL = openTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    return {
      balance: realizedPnL,
      realizedPnL,
      unrealizedPnL
    };
  }

  // Get journal insights
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
              // @ts-ignore - Type inference issue with returned data
      if (trade.mood) {
                // @ts-ignore - Type inference issue with returned data
        if (!performanceByMood[trade.mood]) {
                  // @ts-ignore - Type inference issue with returned data
          performanceByMood[trade.mood] = { totalPnL: 0, count: 0 };
        }
        // @ts-ignore - Type inference issue with returned data
        performanceByMood[trade.mood].totalPnL += trade.profit_loss;
        // @ts-ignore - Type inference issue with returned data
        performanceByMood[trade.mood].count += 1;
      }
// @ts-ignore
      if (trade.market_sentiment) {
        // @ts-ignore
        if (!performanceBySentiment[trade.market_sentiment]) {
          // @ts-ignore
          performanceBySentiment[trade.market_sentiment] = { totalPnL: 0, count: 0 };
        }
        // @ts-ignore - Type inference issue with returned data
        performanceBySentiment[trade.market_sentiment].totalPnL += trade.profit_loss;
        // @ts-ignore
        performanceBySentiment[trade.market_sentiment].count += 1;
      }
    });

    // Calculate averages
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

    // Get recent lessons
    const recentLessons = data
            // @ts-ignore - Type inference issue with returned data
      .filter(trade => trade.lessons_learned && trade.lessons_learned.trim())
      .slice(0, 10)
      // @ts-ignore - Type inference issue with returned data
      .map(trade => trade.lessons_learned);

    return {
      performanceByMood: finalMoodData,
      performanceBySentiment: finalSentimentData,
      recentLessons
    };
  }

  // Calculate P&L based on trade data and status
  private static calculateProfitLoss(trade: {
    status?: string; // Made optional to handle TradeInsert
    side: string;
    quantity: number;
    entry_price: number;
    exit_price?: number | null;
    fees?: number | null;
    commission?: number | null;
  }): number {
    if (trade.status !== 'closed' || !trade.exit_price) {
      return 0;
    }

    const multiplier = (trade.side === 'buy' || trade.side === 'long') ? 1 : -1;
    const grossPnL = multiplier * (trade.exit_price - trade.entry_price) * trade.quantity;
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