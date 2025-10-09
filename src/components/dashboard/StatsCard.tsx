'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, Percent, LucideIcon } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalTrades: number;
    openTrades: number;
    totalPnL: number;
    todayPnL: number;
    winRate: number;
    bestTrade: number;
    worstTrade: number;
    avgWin: number;
    avgLoss: number;
  };
}

interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description: string;
  valueColor: string;
}

// Memoized utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Memoized individual stat card
const StatCard = memo(({ stat }: { stat: StatCardData }) => {
  const Icon = stat.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {stat.title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${stat.valueColor}`}>
          {stat.value}
        </div>
        <div className="flex items-center space-x-1 text-xs mt-1">
          <span
            className={`font-medium ${
              stat.changeType === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : stat.changeType === 'negative'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {stat.change}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {stat.description}
        </div>
      </CardContent>
    </Card>
  );
});
StatCard.displayName = 'StatCard';

export const StatsCards = memo(({ stats }: StatsCardsProps) => {
  // Memoize computed values
  const winLossRatio = useMemo(() => {
    if (stats.avgWin === 0 && stats.avgLoss === 0) return 0;
    if (stats.avgLoss === 0) return stats.avgWin > 0 ? 999 : 0;
    // Calculate ratio: how many times bigger wins are than losses
    return stats.avgWin / stats.avgLoss;
  }, [stats.avgWin, stats.avgLoss]);

  // Memoize formatted values
  const formattedStats = useMemo(() => ({
    totalPnL: formatCurrency(stats.totalPnL),
    winRate: formatPercentage(stats.winRate),
    bestTrade: formatCurrency(stats.bestTrade),
    // worstTrade is negative, so take absolute value for display
    worstTrade: formatCurrency(Math.abs(stats.worstTrade)),
    avgWin: formatCurrency(stats.avgWin),
    // avgLoss is already positive from useTrades hook - no need for Math.abs()
    avgLoss: formatCurrency(stats.avgLoss),
    // Show as ratio in X.X:1 format (standard trading format)
    winLossRatio: winLossRatio >= 999 ? '∞:1' : winLossRatio === 0 ? '0:1' : `${winLossRatio.toFixed(2)}:1`
  }), [stats, winLossRatio]);

  // Memoize stat cards configuration
  const statCards = useMemo<StatCardData[]>(() => [
    {
      title: 'Total P&L',
      value: formattedStats.totalPnL,
      change: stats.totalPnL >= 0 ? '+' : '',
      changeType: stats.totalPnL >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      description: `${stats.totalTrades} total trades`,
      valueColor: stats.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Win Rate',
      value: formattedStats.winRate,
      change: stats.winRate >= 60 ? 'Excellent' : stats.winRate >= 50 ? 'Good' : stats.winRate >= 40 ? 'Fair' : 'Poor',
      changeType: stats.winRate >= 60 ? 'positive' : stats.winRate >= 50 ? 'neutral' : 'negative',
      icon: Target,
      description: 'Success percentage',
      valueColor: stats.winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Open Trades',
      value: stats.openTrades.toString(),
      change: stats.openTrades > 0 ? 'Active' : 'None',
      changeType: 'neutral',
      icon: Activity,
      description: 'Currently open positions',
      valueColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Best Trade',
      value: formattedStats.bestTrade,
      change: stats.bestTrade > 0 ? 'Winner' : 'None',
      changeType: stats.bestTrade > 0 ? 'positive' : 'neutral',
      icon: TrendingUp,
      description: 'Highest single profit',
      valueColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Worst Trade',
      value: formattedStats.worstTrade,
      change: stats.worstTrade < 0 ? 'Loss' : 'None',
      changeType: stats.worstTrade < 0 ? 'negative' : 'neutral',
      icon: TrendingDown,
      description: 'Largest single loss',
      valueColor: 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Avg Win vs Loss',
      value: formattedStats.winLossRatio,
      change: `${formattedStats.avgWin} / ${formattedStats.avgLoss}`,
      changeType: winLossRatio >= 1.5 ? 'positive' : winLossRatio >= 1 ? 'neutral' : 'negative',
      icon: Percent,
      description: 'Win/Loss ratio',
      valueColor: winLossRatio >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }
  ], [stats, formattedStats, winLossRatio]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <StatCard key={`${stat.title}-${index}`} stat={stat} />
      ))}
    </div>
  );
});
StatsCards.displayName = 'StatsCards';