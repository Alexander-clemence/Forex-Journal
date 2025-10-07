'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PnLChart } from '@/components/analytics/PnLChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatsCards } from '@/components/dashboard/StatsCard';
import { RecentTradesCard } from '@/components/dashboard/RecentTradesard';
import { useTrades } from '@/lib/hooks/useTrades';
import { useSimpleBalance } from '@/lib/hooks/useAccountBalance';
import { TrendingUp, TrendingDown, Plus, BarChart3, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { trades, loading, stats } = useTrades();
  const { currentBalance, baseBalance, tradePnL, hasBalance, setBalance, loading: balanceLoading } = useSimpleBalance();
  const [showBalanceEdit, setShowBalanceEdit] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [balanceUpdating, setBalanceUpdating] = useState(false);

  const handleUpdateBalance = async () => {
    const amount = parseFloat(newBalance);
    
    if (isNaN(amount) || amount < 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid amount (0 or greater)',
      });
      return;
    }

    setBalanceUpdating(true);
    try {
      await setBalance(amount);
      setShowBalanceEdit(false);
      setNewBalance('');
      toast.success('Balance Updated', {
        description: `Base balance updated to $${amount.toFixed(2)}`,
      });
    } catch (error) {
      toast.error('Update Failed', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setBalanceUpdating(false);
    }
  };

  const startBalanceEdit = () => {
    setNewBalance(hasBalance ? baseBalance.toString() : '');
    setShowBalanceEdit(true);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const recentTrades = trades.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header with Subtle Balance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your trades today.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Subtle Balance Display */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md border">
            <Wallet className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {balanceLoading ? '...' : `$${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>

          <Button 
            variant="outline"
            onClick={startBalanceEdit}
          >
            Edit Balance
          </Button>

          <Link href="./dashboard/trades/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Trade
            </Button>
          </Link>
          <Link href="./dashboard/analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Balance Edit Form */}
      {showBalanceEdit && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {hasBalance ? 'Update Base Balance' : 'Set Base Balance'}
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="Enter base balance"
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateBalance}
                    disabled={!newBalance || parseFloat(newBalance) < 0 || balanceUpdating}
                    size="sm"
                  >
                    {balanceUpdating ? 'Updating...' : hasBalance ? 'Update' : 'Set'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBalanceEdit(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              
              {newBalance && parseFloat(newBalance) >= 0 && (
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>Base balance: <strong>${parseFloat(newBalance).toFixed(2)}</strong></p>
                  <p>Trade P&L: <strong>${tradePnL.toFixed(2)}</strong></p>
                  <p className="font-semibold">
                    Total balance: <strong>${(parseFloat(newBalance) + tradePnL).toFixed(2)}</strong>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>
                    Your trading performance over time
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PnLChart trades={trades} />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <QuickActions />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total P&L
                </span>
                <div className="flex items-center">
                  {stats.totalPnL >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`font-semibold ${
                    stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${stats.totalPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Account Impact
                </span>
                <span className={`text-sm font-medium ${
                  stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentBalance > 0 ? ((stats.totalPnL / currentBalance) * 100).toFixed(2) : '0.00'}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Open Trades
                </span>
                <span className="font-semibold">{stats.openTrades}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Win Rate
                </span>
                <span className={`font-semibold ${
                  stats.winRate >= 60 ? 'text-green-600' : 
                  stats.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.winRate.toFixed(1)}%
                </span>
              </div>

              <div className="pt-2 border-t">
                <Link href="./dashboard/trades">
                  <Button variant="outline" className="w-full">
                    View All Trades
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Current Balance
                </span>
                <span className="font-semibold">
                  ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Base Balance
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  ${baseBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Trade P&L
                </span>
                <span className={`font-semibold ${
                  tradePnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tradePnL >= 0 ? '+' : ''}${tradePnL.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t">
                <Link href="./dashboard/balance">
                  <Button variant="outline" size="sm" className="w-full">
                    <Wallet className="h-3 w-3 mr-1" />
                    Manage Balance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Market Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  US Markets
                </span>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-600">Open</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">S&P 500</span>
                  <span className="text-green-600">+0.45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">NASDAQ</span>
                  <span className="text-green-600">+0.72%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">VIX</span>
                  <span className="text-red-600">-2.34%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentTradesCard trades={recentTrades} />
    </div>
  );
}