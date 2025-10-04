import { supabase } from '@/lib/supabase/client';

export interface JournalEntry {
  id?: string;
  user_id: string;
  entry_date: string; // matches your column name
  title?: string;
  content?: string;
  mood?: string;
  market_sentiment?: string;
  market_notes?: string;
  daily_pnl?: number;
  lessons_learned?: string;
  created_at?: string;
  updated_at?: string;
}

export class JournalService {
  static async createEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      // @ts-ignore - Type inference issue with returned data
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEntry(id: string, entry: Partial<JournalEntry>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      // @ts-ignore - Type inference issue with returned data
      .update(entry)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getUserEntries(userId: string, filters?: {
    mood?: string;
    search?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{ entries: JournalEntry[]; total: number }> {
    let query = supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.mood && filters.mood !== 'all') {
      query = query.eq('mood', filters.mood);
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,market_notes.ilike.%${filters.search}%,lessons_learned.ilike.%${filters.search}%`);
    }
    
    if (filters?.date_from) {
      query = query.gte('entry_date', filters.date_from);
    }
    
    if (filters?.date_to) {
      query = query.lte('entry_date', filters.date_to);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { entries: data || [], total: count || 0 };
  }

  static async getEntry(id: string): Promise<JournalEntry | null> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  static async getJournalStats(userId: string): Promise<{
    totalEntries: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
    totalPnL: number;
    avgDailyPnL: number;
    mostCommonMood: string;
    bestDay: { date: string; pnl: number } | null;
    worstDay: { date: string; pnl: number } | null;
  }> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('mood, daily_pnl, entry_date, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalEntries: data.length,
      // @ts-ignore - Type inference issue with returned data
      entriesThisWeek: data.filter(e => new Date(e.created_at) >= weekAgo).length,
      // @ts-ignore - Type inference issue with returned data
      entriesThisMonth: data.filter(e => new Date(e.created_at) >= monthAgo).length,
      totalPnL: 0,
      avgDailyPnL: 0,
      mostCommonMood: '',
      bestDay: null as { date: string; pnl: number } | null,
      worstDay: null as { date: string; pnl: number } | null
    };

    // Calculate PnL stats
    // @ts-ignore - Type inference issue with returned data
    const entriesWithPnL = data.filter(e => e.daily_pnl !== null && e.daily_pnl !== undefined && typeof e.daily_pnl === 'number');
    if (entriesWithPnL.length > 0) {
      // @ts-ignore - Type inference issue with returned data
      stats.totalPnL = entriesWithPnL.reduce((sum, e) => sum + (e.daily_pnl as number), 0);
      stats.avgDailyPnL = stats.totalPnL / entriesWithPnL.length;
      
      // Find best and worst days
      // @ts-ignore - Type inference issue with returned data
      const sorted = entriesWithPnL.sort((a, b) => (b.daily_pnl as number) - (a.daily_pnl as number));
      if (sorted.length > 0) {
        stats.bestDay = { 
          // @ts-ignore - Type inference issue with returned data
          date: sorted[0].entry_date, 
          // @ts-ignore - Type inference issue with returned data
          pnl: sorted[0].daily_pnl as number 
        };
        stats.worstDay = { 
          // @ts-ignore - Type inference issue with returned data
          date: sorted[sorted.length - 1].entry_date, 
          // @ts-ignore - Type inference issue with returned data
          pnl: sorted[sorted.length - 1].daily_pnl as number 
        };
      }
    }

    // Find most common mood
    const moodCounts: { [key: string]: number } = data.reduce((acc, e) => {
      //@ts-ignore - Type inference issue with returned data
      if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    if (Object.keys(moodCounts).length > 0) {
      //@ts-ignore
      stats.mostCommonMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
    }

    return stats;
  }

  // Remove trade-specific methods since your schema doesn't have trade references
  // static async getEntriesForTrade(tradeId: string): Promise<JournalEntry[]> { ... }
  // static async getEntriesWithTrades(userId: string): Promise<...> { ... }
}