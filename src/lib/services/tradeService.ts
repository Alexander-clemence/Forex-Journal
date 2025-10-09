import { supabase } from '@/lib/supabase/client';
import { Trade, TradeInsert, TradeUpdate, TradeFilters } from '@/lib/types/trades';

export class TradeService {
  static async createTrade(trade: TradeInsert): Promise<Trade> {
    // Calculate risk/reward ratio if applicable
    const calculatedTrade = {
      ...trade,
      // Don't calculate P&L - let user enter it directly
      risk_reward_ratio: trade.stop_loss && trade.take_profit 
        ? this.calculateRiskRewardRatio(trade.entry_price, trade.stop_loss, trade.take_profit)
        : null
    };

    const { data, error } = await supabase
      .from('trades')
      // @ts-ignore
      .insert([calculatedTrade])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTrade(id: string, trade: TradeUpdate): Promise<Trade> {
    const { data: existing } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new Error('Trade not found');
    }

    const updatedTrade = {
      ...trade,
    };

    // Recalculate risk/reward ratio if relevant fields changed
    //@ts-ignore
    if (trade.stop_loss && trade.take_profit && (trade.entry_price || existing.entry_price)) {
      updatedTrade.risk_reward_ratio = this.calculateRiskRewardRatio(
        //@ts-ignore
        trade.entry_price || existing.entry_price,
        trade.stop_loss,
        trade.take_profit
      );
    }

    const { data, error } = await supabase
      .from('trades')
      // @ts-ignore
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
      .select('status, profit_loss, mood, market_sentiment')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      totalTrades: data.length,
      openTrades: data.filter((t: any) => t.status === 'open').length,
      closedTrades: data.filter((t: any) => t.status === 'closed').length,
      totalPnL: data.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0),
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      moodStats: {},
      avgPerformanceRating: 0,
      commonMarketSentiment: ''
    };

    const closedTrades = data.filter((t: any) => t.status === 'closed' && t.profit_loss !== null);
    const winningTrades = closedTrades.filter((t: any) => t.profit_loss > 0);
    const losingTrades = closedTrades.filter((t: any) => t.profit_loss < 0);

    if (closedTrades.length > 0) {
      stats.winRate = (winningTrades.length / closedTrades.length) * 100;
    }

    if (winningTrades.length > 0) {
      const totalWinAmount = winningTrades.reduce((sum: number, t: any) => sum + t.profit_loss, 0);
      stats.avgWin = totalWinAmount / winningTrades.length;
    }

    if (losingTrades.length > 0) {
      const totalLossAmount = losingTrades.reduce((sum: number, t: any) => sum + Math.abs(t.profit_loss), 0);
      stats.avgLoss = totalLossAmount / losingTrades.length;
    }

    const moodCounts: { [key: string]: number } = {};
    data.forEach((trade: any) => {
      if (trade.mood) {
        moodCounts[trade.mood] = (moodCounts[trade.mood] || 0) + 1;
      }
    });
    stats.moodStats = moodCounts;

    const sentimentCounts: { [key: string]: number } = {};
    data.forEach((trade: any) => {
      if (trade.market_sentiment) {
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
    
    const closedTrades = data.filter((t: any) => t.status === 'closed');
    const openTrades = data.filter((t: any) => t.status === 'open');
    const realizedPnL = closedTrades.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);
    const unrealizedPnL = openTrades.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);

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

    data.forEach((trade: any) => {
      if (trade.mood) {
        if (!performanceByMood[trade.mood]) {
          performanceByMood[trade.mood] = { totalPnL: 0, count: 0 };
        }
        performanceByMood[trade.mood].totalPnL += trade.profit_loss;
        performanceByMood[trade.mood].count += 1;
      }

      if (trade.market_sentiment) {
        if (!performanceBySentiment[trade.market_sentiment]) {
          performanceBySentiment[trade.market_sentiment] = { totalPnL: 0, count: 0 };
        }
        performanceBySentiment[trade.market_sentiment].totalPnL += trade.profit_loss;
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

    const recentLessons = data
      .filter((trade: any) => trade.lessons_learned && trade.lessons_learned.trim())
      .slice(0, 10)
      .map((trade: any) => trade.lessons_learned);

    return {
      performanceByMood: finalMoodData,
      performanceBySentiment: finalSentimentData,
      recentLessons
    };
  }

  // REMOVED: calculateProfitLoss() - Users enter P&L directly from broker
  
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