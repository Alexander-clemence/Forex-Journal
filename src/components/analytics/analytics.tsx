'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Star,
  Heart
} from 'lucide-react';
import { Trade } from '@/lib/types/trades';
import { useTrades } from '@/lib/hooks/useTrades';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';
import type { AnalyticsTab } from '@/lib/stores/analyticsStore';
import { useShallow } from 'zustand/react/shallow';
import { TradeTimeline } from '@/components/analytics/TradeTimeline';
import { SectionHeading } from '@/components/dashboard/SectionHeading';

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4'];

const moodColors: Record<string, string> = {
  confident: '#10B981',
  analytical: '#3B82F6',
  cautious: '#F59E0B',
  frustrated: '#EF4444',
  disappointed: '#EF4444',
  excited: '#8B5CF6',
  focused: '#6366F1',
  nervous: '#F97316',
  optimistic: '#059669',
  neutral: '#6B7280',
  anxious: '#F97316'
};

const tabDescriptions: Record<AnalyticsTab, string> = {
  performance: 'Track profitability, win rate trends, and compare periods to understand momentum.',
  psychology: 'See how mood and sentiment impact results so you can adapt your mindset in real time.',
  strategy: 'Identify which playbooks are carrying your equity curve and which need a tune-up.',
  insights: 'Curated callouts highlight patterns, quick wins, and areas to investigate.',
  timeline: 'Scroll through trades chronologically to understand streaks and market context.',
};

export function TradingAnalytics() {
  const { trades, loading } = useTrades();
  const {
    timeRange,
    activeTab,
    setTimeRange,
    setActiveTab,
  } = useAnalyticsStore(useShallow((state) => ({
    timeRange: state.timeRange,
    activeTab: state.activeTab,
    setTimeRange: state.setTimeRange,
    setActiveTab: state.setActiveTab,
  })));

  const [timelineRange, setTimelineRange] = useState<'all' | '1m' | '3m' | '6m' | '12m'>('3m');
  const [timelineTradeFilter, setTimelineTradeFilter] = useState<'all' | 'wins' | 'losses' | 'open' | 'closed'>('all');

  const filteredTrades = useMemo(() => {
    if (!trades.length) return [];

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return trades;
    }

    return trades.filter(trade => new Date(trade.entry_date) >= cutoffDate);
  }, [trades, timeRange]);

  const timelineFilteredTrades = useMemo(() => {
    let result = [...filteredTrades];

    if (timelineRange !== 'all') {
      const cutoff = new Date();
      switch (timelineRange) {
        case '1m':
          cutoff.setMonth(cutoff.getMonth() - 1);
          break;
        case '3m':
          cutoff.setMonth(cutoff.getMonth() - 3);
          break;
        case '6m':
          cutoff.setMonth(cutoff.getMonth() - 6);
          break;
        case '12m':
          cutoff.setFullYear(cutoff.getFullYear() - 1);
          break;
      }
      result = result.filter((trade) => {
        const referenceDate = trade.entry_date || trade.created_at;
        if (!referenceDate) return false;
        return new Date(referenceDate) >= cutoff;
      });
    }

    if (timelineTradeFilter !== 'all') {
      result = result.filter((trade) => {
        switch (timelineTradeFilter) {
          case 'wins':
            return trade.status === 'closed' && (trade.profit_loss || 0) > 0;
          case 'losses':
            return trade.status === 'closed' && (trade.profit_loss || 0) < 0;
          case 'open':
            return trade.status === 'open';
          case 'closed':
            return trade.status === 'closed';
          default:
            return true;
        }
      });
    }

    return result;
  }, [filteredTrades, timelineRange, timelineTradeFilter]);

  // Performance Analytics
  const performanceData = useMemo(() => {
    const closedTrades = filteredTrades.filter(t => t.status === 'closed' && t.profit_loss !== null);

    // Group by week for performance over time
    const weeklyData = closedTrades.reduce((acc, trade) => {
      const week = new Date(trade.entry_date).toISOString().slice(0, 10);
      if (!acc[week]) {
        acc[week] = { date: week, pnl: 0, trades: 0, winRate: 0, wins: 0, losses: 0 };
      }
      acc[week].pnl += trade.profit_loss || 0;
      acc[week].trades += 1;
      if ((trade.profit_loss || 0) > 0) {
        acc[week].wins += 1;
      } else {
        acc[week].losses += 1;
      }
      acc[week].winRate = (acc[week].wins / acc[week].trades) * 100;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(weeklyData).sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredTrades]);

  // Psychology Analytics
  const psychologyData = useMemo(() => {
    const tradesWithMood = filteredTrades.filter(t => t.mood);

    // Mood distribution
    const moodDistribution = tradesWithMood.reduce((acc, trade) => {
      const mood = trade.mood!;
      if (!acc[mood]) {
        acc[mood] = {
          mood,
          count: 0,
          totalPnL: 0,
          avgPnL: 0,
          winRate: 0,
          wins: 0,
          losses: 0
        };
      }
      acc[mood].count += 1;
      if (trade.status === 'closed' && trade.profit_loss !== null) {
        acc[mood].totalPnL += trade.profit_loss;
        if (trade.profit_loss > 0) {
          acc[mood].wins += 1;
        } else {
          acc[mood].losses += 1;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(moodDistribution).forEach((data: any) => {
      data.avgPnL = data.count > 0 ? data.totalPnL / data.count : 0;
      const totalDecisions = data.wins + data.losses;
      data.winRate = totalDecisions > 0 ? (data.wins / totalDecisions) * 100 : 0;
    });

    return Object.values(moodDistribution);
  }, [filteredTrades]);

  // Market Sentiment Analytics
  const sentimentData = useMemo(() => {
    const tradesWithSentiment = filteredTrades.filter(t => t.market_sentiment);

    const sentimentAnalysis = tradesWithSentiment.reduce((acc, trade) => {
      const sentiment = trade.market_sentiment!;
      if (!acc[sentiment]) {
        acc[sentiment] = {
          sentiment,
          count: 0,
          totalPnL: 0,
          avgPnL: 0,
          winRate: 0,
          wins: 0,
          losses: 0
        };
      }
      acc[sentiment].count += 1;
      if (trade.status === 'closed' && trade.profit_loss !== null) {
        acc[sentiment].totalPnL += trade.profit_loss;
        if (trade.profit_loss > 0) {
          acc[sentiment].wins += 1;
        } else {
          acc[sentiment].losses += 1;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    Object.values(sentimentAnalysis).forEach((data: any) => {
      data.avgPnL = data.count > 0 ? data.totalPnL / data.count : 0;
      const totalDecisions = data.wins + data.losses;
      data.winRate = totalDecisions > 0 ? (data.wins / totalDecisions) * 100 : 0;
    });

    return Object.values(sentimentAnalysis);
  }, [filteredTrades]);

  // Strategy Performance
  const strategyData = useMemo(() => {
    const tradesWithStrategy = filteredTrades.filter(t => t.strategy);

    const strategyAnalysis = tradesWithStrategy.reduce((acc, trade) => {
      const originalStrategy = trade.strategy!;
      // Normalize strategy name to lowercase for case-insensitive grouping
      const normalizedStrategy = originalStrategy.toLowerCase().trim();
      
      if (!acc[normalizedStrategy]) {
        acc[normalizedStrategy] = {
          strategy: originalStrategy, // Keep original capitalization for display
          count: 0,
          totalPnL: 0,
          avgPnL: 0,
          winRate: 0,
          wins: 0,
          losses: 0
        };
      } else {
        // If we encounter a different capitalization, use the most common one
        // For now, keep the first one encountered, but you could track frequency
        // This ensures consistent display while grouping correctly
      }
      
      acc[normalizedStrategy].count += 1;
      if (trade.status === 'closed' && trade.profit_loss !== null) {
        acc[normalizedStrategy].totalPnL += trade.profit_loss;
        if (trade.profit_loss > 0) {
          acc[normalizedStrategy].wins += 1;
        } else {
          acc[normalizedStrategy].losses += 1;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    Object.values(strategyAnalysis).forEach((data: any) => {
      data.avgPnL = data.count > 0 ? data.totalPnL / data.count : 0;
      const totalDecisions = data.wins + data.losses;
      data.winRate = totalDecisions > 0 ? (data.wins / totalDecisions) * 100 : 0;
    });

    return Object.values(strategyAnalysis).sort((a: any, b: any) => b.totalPnL - a.totalPnL);
  }, [filteredTrades]);

  // Performance Rating Analytics
  const ratingData = useMemo(() => {
    const tradesWithRating = filteredTrades.filter(t => t.performance_rating);

    const ratingAnalysis = tradesWithRating.reduce((acc, trade) => {
      const rating = trade.performance_rating!;
      if (!acc[rating]) {
        acc[rating] = {
          rating,
          count: 0,
          totalPnL: 0,
          avgPnL: 0,
          winRate: 0,
          wins: 0,
          losses: 0
        };
      }
      acc[rating].count += 1;
      if (trade.status === 'closed' && trade.profit_loss !== null) {
        acc[rating].totalPnL += trade.profit_loss;
        if (trade.profit_loss > 0) {
          acc[rating].wins += 1;
        } else {
          acc[rating].losses += 1;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    Object.values(ratingAnalysis).forEach((data: any) => {
      data.avgPnL = data.count > 0 ? data.totalPnL / data.count : 0;
      const totalDecisions = data.wins + data.losses;
      data.winRate = totalDecisions > 0 ? (data.wins / totalDecisions) * 100 : 0;
    });

    return Object.values(ratingAnalysis).sort((a: any, b: any) => a.rating - b.rating);
  }, [filteredTrades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const rangeDays = useMemo(() => {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return null;
    }
  }, [timeRange]);

  const comparisonStats = useMemo(() => {
    if (!rangeDays) return [];
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - rangeDays);
    const previousEnd = new Date(currentStart);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - rangeDays);

    const inRange = (trade: Trade, start: Date, end: Date) => {
      if (!trade.entry_date) return false;
      const date = new Date(trade.entry_date);
      return date >= start && date <= end;
    };

    const currentTrades = trades.filter((trade) => inRange(trade, currentStart, now));
    const previousTrades = trades.filter((trade) => inRange(trade, previousStart, previousEnd));

    const computeStats = (list: Trade[]) => {
      const closed = list.filter((t) => t.status === 'closed' && t.profit_loss !== null);
      const pnl = closed.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const wins = closed.filter((t) => (t.profit_loss || 0) > 0);
      const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
      const durations = closed
        .filter((t) => t.entry_date && t.exit_date)
        .map((t) => {
          const start = new Date(t.entry_date!);
          const end = new Date(t.exit_date!);
          return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        });
      const avgDuration = durations.length
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;
      return { pnl, winRate, avgDuration };
    };

    const current = computeStats(currentTrades);
    const previous = computeStats(previousTrades);
    const diff = (currentValue: number, prevValue: number) => currentValue - prevValue;

    return [
      {
        label: 'Total P&L',
        value: formatCurrency(current.pnl),
        delta: diff(current.pnl, previous.pnl),
        formatter: formatCurrency,
      },
      {
        label: 'Win Rate',
        value: formatPercentage(current.winRate),
        delta: diff(current.winRate, previous.winRate),
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
      {
        label: 'Avg Duration',
        value: `${current.avgDuration.toFixed(1)}d`,
        delta: diff(current.avgDuration, previous.avgDuration),
        formatter: (val: number) => `${val.toFixed(1)}d`,
      },
    ];
  }, [trades, rangeDays, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="analytics-heading" className="space-y-4">
        <SectionHeading
          id="analytics-heading"
          title="Trading analytics"
          description="Explore performance drivers, psychological patterns, and actionable insights across your journal."
          tourId="analytics-heading"
        >
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </SectionHeading>
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {tabDescriptions[activeTab]}
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AnalyticsTab)}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5 gap-2" data-tour="tabs-list">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-6">
          {comparisonStats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tour="comparison-cards" id="analytics-metrics">
              {comparisonStats.map((stat) => {
                const delta = stat.delta;
                const isPositive = delta >= 0;
                return (
                  <Card key={stat.label}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                      <p
                        className={`text-sm font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {stat.formatter(Math.abs(delta))} vs previous period
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-charts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  P&L Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'P&L']} />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Win Rate Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Win Rate']} />
                    <Line
                      type="monotone"
                      dataKey="winRate"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Rating Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {ratingData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  <Star className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Performance Ratings</p>
                  <p className="text-sm text-center">
                    Rate your trades to see performance analysis by rating.
                  </p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="rating" 
                      tickFormatter={(value) => `${value}⭐`}
                    />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'avgPnL' ? formatCurrency(Number(value)) : `${Number(value).toFixed(1)}%`,
                      name === 'avgPnL' ? 'Avg P&L' : 'Win Rate'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="avgPnL" fill="#3B82F6" name="Avg P&L" />
                  <Bar dataKey="winRate" fill="#10B981" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Psychology Analytics */}
        <TabsContent value="psychology" className="space-y-6" id="analytics-psychology">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Performance by Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={psychologyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mood" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Avg P&L']} />
                    <Bar dataKey="avgPnL">
                      {psychologyData.map((entry: any, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={moodColors[entry.mood] || '#6B7280'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Mood Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={psychologyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      //@ts-ignore
                      label={({ mood, percent }) => `${mood} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {psychologyData.map((entry: any, index) => (
                        <Cell key={`cell-${index}`} fill={moodColors[entry.mood] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Market Sentiment Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sentiment" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'avgPnL' ? formatCurrency(Number(value)) : `${Number(value).toFixed(1)}%`,
                      name === 'avgPnL' ? 'Avg P&L' : 'Win Rate'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="avgPnL" fill="#8B5CF6" name="Avg P&L" />
                  <Bar dataKey="winRate" fill="#F59E0B" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Analytics */}
        <TabsContent value="strategy" className="space-y-6" id="analytics-strategy-symbol">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Strategy Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strategyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
                  <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Strategy Data</p>
                  <p className="text-sm text-center">
                    Add strategies to your trades to see performance analysis.
                  </p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="strategy" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis 
                      yAxisId="left"
                      tickFormatter={formatCurrency}
                      label={{ value: 'Total P&L ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      label={{ value: 'Win Rate (%)', angle: 90, position: 'insideRight' }}
                    />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'totalPnL' ? formatCurrency(Number(value)) : `${Number(value).toFixed(1)}%`,
                      name === 'totalPnL' ? 'Total P&L' : 'Win Rate'
                    ]}
                  />
                  <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="totalPnL" 
                      fill="#3B82F6" 
                      name="Total P&L"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Win Rate"
                    />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategyData.slice(0, 6).map((strategy: any, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{strategy.strategy}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total P&L:</span>
                      <span className={`font-medium ${strategy.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(strategy.totalPnL)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Win Rate:</span>
                      <span className="font-medium">{strategy.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trades:</span>
                      <span className="font-medium">{strategy.count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Key Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {psychologyData
                  .filter((mood: any) => mood.avgPnL > 0)
                  .sort((a: any, b: any) => b.avgPnL - a.avgPnL)
                  .slice(0, 3)
                  .map((mood: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded">
                      <div className="flex items-center">
                        <Badge style={{ backgroundColor: moodColors[mood.mood] }} className="text-white mr-2">
                          {mood.mood}
                        </Badge>
                        <span className="text-sm">Best mood for trading</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">{formatCurrency(mood.avgPnL)}</div>
                        <div className="text-xs text-gray-500">{mood.winRate.toFixed(1)}% win rate</div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {psychologyData
                  .filter((mood: any) => mood.avgPnL < 0)
                  .sort((a: any, b: any) => a.avgPnL - b.avgPnL)
                  .slice(0, 3)
                  .map((mood: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded">
                      <div className="flex items-center">
                        <Badge style={{ backgroundColor: moodColors[mood.mood] }} className="text-white mr-2">
                          {mood.mood}
                        </Badge>
                        <span className="text-sm">Challenging mood</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-red-600">{formatCurrency(mood.avgPnL)}</div>
                        <div className="text-xs text-gray-500">{mood.winRate.toFixed(1)}% win rate</div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded">
                  <div className="text-2xl font-bold text-blue-600">{filteredTrades.length}</div>
                  <div className="text-sm text-gray-600">Total Trades</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredTrades.filter(t => t.mood).length}
                  </div>
                  <div className="text-sm text-gray-600">With Mood Data</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredTrades.filter(t => t.performance_rating).length}
                  </div>
                  <div className="text-sm text-gray-600">With Ratings</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredTrades.filter(t => t.lessons_learned).length}
                  </div>
                  <div className="text-sm text-gray-600">With Lessons</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-6" id="timeline-section">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trade Timeline
              </CardTitle>
              <CardDescription>
                  Chronological view of trades—filter by timeframe and trade outcome to spot streaks faster.
              </CardDescription>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={timelineRange} onValueChange={(value) => setTimelineRange(value as 'all' | '1m' | '3m' | '6m' | '12m')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Timeline range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">Last 30 days</SelectItem>
                    <SelectItem value="3m">Last 3 months</SelectItem>
                    <SelectItem value="6m">Last 6 months</SelectItem>
                    <SelectItem value="12m">Last 12 months</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timelineTradeFilter} onValueChange={(value) => setTimelineTradeFilter(value as 'all' | 'wins' | 'losses' | 'open' | 'closed')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trade filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All trades</SelectItem>
                    <SelectItem value="wins">Winning trades</SelectItem>
                    <SelectItem value="losses">Losing trades</SelectItem>
                    <SelectItem value="open">Open trades</SelectItem>
                    <SelectItem value="closed">Closed trades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <TradeTimeline trades={timelineFilteredTrades} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}