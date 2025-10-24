'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PnLChartProps {
  trades: any[]; // Array of trades from Supabase
  timeframe?: string; // Add timeframe as optional prop
}

// Process real trade data into chart format
const processTradeData = (trades: any[]) => {
  if (!trades || trades.length === 0) {
    return [];
  }

  // Group trades by date and calculate cumulative P&L
  const tradesByDate = new Map();
  
  trades
    .filter(trade => trade.status === 'closed' && trade.profit_loss !== null)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
    .forEach(trade => {
      const date = new Date(trade.entry_date).toISOString().split('T')[0];
      
      if (!tradesByDate.has(date)) {
        tradesByDate.set(date, {
          date,
          daily_pnl: 0,
          trade_count: 0
        });
      }
      
      const dayData = tradesByDate.get(date);
      dayData.daily_pnl += trade.profit_loss || 0;
      dayData.trade_count += 1;
    });

  // Convert to array and add cumulative P&L
  const chartData = Array.from(tradesByDate.values());
  let cumulativePnL = 0;
  
  return chartData.map(day => {
    cumulativePnL += day.daily_pnl;
    return {
      ...day,
      cumulative_pnl: cumulativePnL
    };
  });
};

export function PnLChart({ trades, timeframe = 'All Time' }: PnLChartProps) {
  const data = processTradeData(trades);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeframe === '1W') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeframe === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0].payload; // Get the full data object
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {new Date(label).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Daily P&L: </span>
              <span className={`font-medium ${
                data.daily_pnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data.daily_pnl)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total P&L: </span>
              <span className={`font-medium ${
                data.cumulative_pnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data.cumulative_pnl)}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trades: {data.trade_count}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const finalPnL = data[data.length - 1]?.cumulative_pnl || 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(finalPnL)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total P&L ({timeframe})
          </p>
        </div>
        <div className={`text-sm font-medium ${finalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {finalPnL >= 0 ? '+' : ''}{((finalPnL / 10000) * 100).toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={finalPnL >= 0 ? "#10b981" : "#ef4444"} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={finalPnL >= 0 ? "#10b981" : "#ef4444"} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="date"
              tickFormatter={formatDate}
              className="text-gray-500 dark:text-gray-400"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              className="text-gray-500 dark:text-gray-400"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="cumulative_pnl"
              stroke={finalPnL >= 0 ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#colorPnL)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.reduce((sum, d) => sum + d.trade_count, 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Trades</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-green-600">
            {(() => {
              const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.profit_loss !== null);
              const winningTrades = closedTrades.filter(trade => (trade.profit_loss || 0) > 0);
              const bestTrade = winningTrades.length > 0 
                ? Math.max(...winningTrades.map(trade => trade.profit_loss || 0))
                : 0;
              return formatCurrency(bestTrade);
            })()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Best Trade</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-red-600">
            {(() => {
              const closedTrades = trades.filter(trade => trade.status === 'closed' && trade.profit_loss !== null);
              const losingTrades = closedTrades.filter(trade => (trade.profit_loss || 0) < 0);
              const worstTrade = losingTrades.length > 0
                ? Math.min(...losingTrades.map(trade => trade.profit_loss || 0))
                : 0;
              return formatCurrency(Math.abs(worstTrade));
            })()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Worst Trade</p>
        </div>
      </div>
    </div>
  );
}