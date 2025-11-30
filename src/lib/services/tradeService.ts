import { supabase } from '@/lib/supabase/client';
import { Trade, TradeInsert, TradeUpdate, TradeFilters } from '@/lib/types/trades';

export class TradeService {
  static async createTrade(trade: TradeInsert): Promise<Trade> {
    // Calculate risk/reward ratio if applicable
    const calculatedTrade = {
      ...trade,
      risk_reward_ratio: trade.stop_loss && trade.take_profit 
        ? this.calculateRiskRewardRatio(trade.entry_price, trade.stop_loss, trade.take_profit)
        : null
    };

    const { data, error } = await supabase
      .from('trades')
      .insert([calculatedTrade] as any)
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

    const existingTrade = existing as Trade;

    const updatedTrade = {
      ...trade,
    };

    // Recalculate risk/reward ratio if relevant fields changed
    if (trade.stop_loss && trade.take_profit && (trade.entry_price || existingTrade.entry_price)) {
      updatedTrade.risk_reward_ratio = this.calculateRiskRewardRatio(
        trade.entry_price || existingTrade.entry_price,
        trade.stop_loss,
        trade.take_profit
      );
    }

    const { data, error } = await supabase
      .from('trades')
      .update(updatedTrade as any)
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
    // Note: trade_metrics and trade_reviews are auto-deleted via foreign key cascade
  }

  /**
   * Get user trades - optionally uses trade_full_view for enriched data
   */
  static async getUserTrades(
    userId: string, 
    filters?: TradeFilters,
    useView: boolean = true
  ): Promise<{ trades: Trade[]; total: number }> {
    const tableName = useView ? 'trade_full_view' : 'trades';
    
    let query = supabase
      .from(tableName)
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
    
    // Map view results to Trade type (discard prefixed columns we don't need in components)
    const trades: Trade[] = (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      symbol: row.symbol,
      side: row.side,
      quantity: row.quantity,
      entry_price: row.entry_price,
      exit_price: row.exit_price,
      entry_date: row.entry_date,
      exit_date: row.exit_date,
      status: row.status,
      profit_loss: row.profit_loss,
      fees: row.fees,
      commission: row.commission,
      strategy: row.strategy,
      strategy_id: row.strategy_id || null,
      setup: row.setup,
      notes: row.notes,
      tags: row.tags,
      stop_loss: row.stop_loss,
      take_profit: row.take_profit,
      risk_reward_ratio: row.risk_reward_ratio || row.metrics_risk_reward_ratio,
      mood: row.mood,
      market_sentiment: row.market_sentiment,
      market_notes: row.market_notes,
      lessons_learned: row.lessons_learned || row.review_lesson_learned,
      trade_analysis: row.trade_analysis || row.review_market_analysis,
      emotional_state: row.emotional_state || row.review_emotional_state,
      pre_trade_plan: row.pre_trade_plan || row.review_pre_trade_plan,
      post_trade_review: row.post_trade_review || row.review_post_trade_review,
      performance_rating: row.performance_rating || row.review_performance_rating,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return { trades, total: count || 0 };
  }

  static async getTrade(id: string, useView: boolean = true): Promise<Trade | null> {
    const tableName = useView ? 'trade_full_view' : 'trades';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    // Map to Trade type (same mapping as getUserTrades)
    const tradeData = data as any;
    return {
      id: tradeData.id,
      user_id: tradeData.user_id,
      symbol: tradeData.symbol,
      side: tradeData.side,
      quantity: tradeData.quantity,
      entry_price: tradeData.entry_price,
      exit_price: tradeData.exit_price,
      entry_date: tradeData.entry_date,
      exit_date: tradeData.exit_date,
      status: tradeData.status,
      profit_loss: tradeData.profit_loss,
      fees: tradeData.fees,
      commission: tradeData.commission,
      strategy: tradeData.strategy,
      strategy_id: tradeData.strategy_id || null,
      setup: tradeData.setup,
      notes: tradeData.notes,
      tags: tradeData.tags,
      stop_loss: tradeData.stop_loss,
      take_profit: tradeData.take_profit,
      risk_reward_ratio: tradeData.risk_reward_ratio || tradeData.metrics_risk_reward_ratio,
      mood: tradeData.mood,
      market_sentiment: tradeData.market_sentiment,
      market_notes: tradeData.market_notes,
      lessons_learned: tradeData.lessons_learned || tradeData.review_lesson_learned,
      trade_analysis: tradeData.trade_analysis || tradeData.review_market_analysis,
      emotional_state: tradeData.emotional_state || tradeData.review_emotional_state,
      pre_trade_plan: tradeData.pre_trade_plan || tradeData.review_pre_trade_plan,
      post_trade_review: tradeData.post_trade_review || tradeData.review_post_trade_review,
      performance_rating: tradeData.performance_rating || tradeData.review_performance_rating,
      created_at: tradeData.created_at,
      updated_at: tradeData.updated_at,
    };
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
    const { trades } = await this.getUserTrades(userId, undefined, false);

    const stats = {
      totalTrades: trades.length,
      openTrades: trades.filter(t => t.status === 'open').length,
      closedTrades: trades.filter(t => t.status === 'closed').length,
      totalPnL: trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      moodStats: {} as { [key: string]: number },
      avgPerformanceRating: 0,
      commonMarketSentiment: ''
    };

    const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);
    const winningTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.profit_loss || 0) < 0);

    if (closedTrades.length > 0) {
      stats.winRate = (winningTrades.length / closedTrades.length) * 100;
    }

    if (winningTrades.length > 0) {
      const totalWinAmount = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      stats.avgWin = totalWinAmount / winningTrades.length;
    }

    if (losingTrades.length > 0) {
      const totalLossAmount = losingTrades.reduce((sum, t) => sum + Math.abs(t.profit_loss || 0), 0);
      stats.avgLoss = totalLossAmount / losingTrades.length;
    }

    const moodCounts: { [key: string]: number } = {};
    trades.forEach(trade => {
      if (trade.mood) {
        moodCounts[trade.mood] = (moodCounts[trade.mood] || 0) + 1;
      }
    });
    stats.moodStats = moodCounts;

    const sentimentCounts: { [key: string]: number } = {};
    trades.forEach(trade => {
      if (trade.market_sentiment) {
        sentimentCounts[trade.market_sentiment] = (sentimentCounts[trade.market_sentiment] || 0) + 1;
      }
    });
    
    if (Object.keys(sentimentCounts).length > 0) {
      stats.commonMarketSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
        sentimentCounts[a] > sentimentCounts[b] ? a : b
      );
    }

    const tradesWithRating = trades.filter(t => t.performance_rating !== null && t.performance_rating !== undefined);
    if (tradesWithRating.length > 0) {
      const totalRating = tradesWithRating.reduce((sum, t) => sum + (t.performance_rating || 0), 0);
      stats.avgPerformanceRating = totalRating / tradesWithRating.length;
    }

    return stats;
  }

  static async getUserBalance(userId: string): Promise<{
    balance: number;
    realizedPnL: number;
    unrealizedPnL: number;
  }> {
    const { trades } = await this.getUserTrades(userId, undefined, false);
    
    const closedTrades = trades.filter(t => t.status === 'closed');
    const openTrades = trades.filter(t => t.status === 'open');
    const realizedPnL = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
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
    const { trades } = await this.getUserTrades(userId, { status: 'closed' }, false);
    
    const closedTradesWithPnL = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

    const performanceByMood: { [mood: string]: { totalPnL: number; count: number } } = {};
    const performanceBySentiment: { [sentiment: string]: { totalPnL: number; count: number } } = {};

    closedTradesWithPnL.forEach(trade => {
      if (trade.mood) {
        if (!performanceByMood[trade.mood]) {
          performanceByMood[trade.mood] = { totalPnL: 0, count: 0 };
        }
        performanceByMood[trade.mood].totalPnL += trade.profit_loss || 0;
        performanceByMood[trade.mood].count += 1;
      }

      if (trade.market_sentiment) {
        if (!performanceBySentiment[trade.market_sentiment]) {
          performanceBySentiment[trade.market_sentiment] = { totalPnL: 0, count: 0 };
        }
        performanceBySentiment[trade.market_sentiment].totalPnL += trade.profit_loss || 0;
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

    const recentLessons = closedTradesWithPnL
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter(trade => trade.lessons_learned && trade.lessons_learned.trim())
      .slice(0, 10)
      .map(trade => trade.lessons_learned!)
      .filter((lesson): lesson is string => lesson !== null);

    return {
      performanceByMood: finalMoodData,
      performanceBySentiment: finalSentimentData,
      recentLessons
    };
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