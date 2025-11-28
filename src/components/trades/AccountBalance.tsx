'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSimpleBalance } from '@/lib/hooks/useAccountBalance';
import { 
  Wallet, 
  RefreshCw,
  Edit,
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Memoized Loading Component
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center p-8">
    <RefreshCw className="h-8 w-8 animate-spin" />
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Memoized Balance Breakdown Component
const BalanceBreakdown = memo(({ 
  baseBalance, 
  tradePnL 
}: { 
  baseBalance: number; 
  tradePnL: number;
}) => {
  const formattedBase = useMemo(() => 
    baseBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    [baseBalance]
  );

  const pnlDisplay = useMemo(() => ({
    formatted: tradePnL.toFixed(2),
    color: tradePnL >= 0 ? 'text-green-600' : 'text-red-600',
    icon: tradePnL >= 0 ? TrendingUp : TrendingDown,
    prefix: tradePnL >= 0 ? '+' : ''
  }), [tradePnL]);

  const PnLIcon = pnlDisplay.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" id="balance-breakdown-section">
      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-500 block mb-1">Base Balance</span>
        <span className="text-xl font-semibold">
          ${formattedBase}
        </span>
      </div>
      
      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-500 block mb-1">Trade P&L</span>
        <div className={`text-xl font-semibold flex items-center justify-center gap-1 ${pnlDisplay.color}`}>
          <PnLIcon className="h-4 w-4" />
          {pnlDisplay.prefix}${pnlDisplay.formatted}
        </div>
      </div>
    </div>
  );
});
BalanceBreakdown.displayName = 'BalanceBreakdown';

// Memoized Balance Display Component
const CurrentBalanceDisplay = memo(({ 
  currentBalance,
  hasBalance,
  onEdit
}: { 
  currentBalance: number;
  hasBalance: boolean;
  onEdit: () => void;
}) => {
  const formattedBalance = useMemo(() => 
    currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    [currentBalance]
  );

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-sm text-gray-500">Current Balance</span>
        {hasBalance && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 w-6 p-0"
            title="Edit base balance"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="text-4xl font-bold text-blue-600">
        ${formattedBalance}
      </div>
      
      {!hasBalance && (
        <p className="text-sm text-gray-500 mt-2">
          No balance record found
        </p>
      )}
    </div>
  );
});
CurrentBalanceDisplay.displayName = 'CurrentBalanceDisplay';

// Memoized Balance Preview Component
const BalancePreview = memo(({ 
  newBalance, 
  tradePnL 
}: { 
  newBalance: string; 
  tradePnL: number;
}) => {
  const preview = useMemo(() => {
    const base = parseFloat(newBalance);
    if (isNaN(base) || base < 0) return null;
    
    return {
      base: base.toFixed(2),
      pnl: tradePnL.toFixed(2),
      total: (base + tradePnL).toFixed(2)
    };
  }, [newBalance, tradePnL]);

  if (!preview) return null;

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
      <p>Base balance: <strong>${preview.base}</strong></p>
      <p>Trade P&L: <strong>${preview.pnl}</strong></p>
      <p className="text-blue-600 font-semibold">
        Total balance: <strong>${preview.total}</strong>
      </p>
    </div>
  );
});
BalancePreview.displayName = 'BalancePreview';

// Memoized Info Card Component
const InfoCard = memo(({ hasBalance }: { hasBalance: boolean }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-center text-sm text-gray-500 space-y-2">
        {hasBalance ? (
          <>
            <p>Your current balance automatically includes trade P&L.</p>
            <p>Update your base balance if you deposit/withdraw funds.</p>
          </>
        ) : (
          <p>Create a base balance record to start tracking your account value with automatic trade P&L.</p>
        )}
      </div>
    </CardContent>
  </Card>
));
InfoCard.displayName = 'InfoCard';

export default function SimpleBalanceManager() {
  const {
    currentBalance,
    baseBalance,
    tradePnL,
    hasBalance,
    loading,
    error,
    setBalance,
    createBalance,
    refresh
  } = useSimpleBalance();

  const [isEditing, setIsEditing] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [processing, setProcessing] = useState(false);

  // Memoized validation
  const isValidAmount = useMemo(() => {
    const amount = parseFloat(newBalance);
    return !isNaN(amount) && amount >= 0;
  }, [newBalance]);

  // Memoized handlers
  const handleSetBalance = useCallback(async () => {
    const amount = parseFloat(newBalance);
    
    if (isNaN(amount) || amount < 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid amount (0 or greater)'
      });
      return;
    }

    setProcessing(true);
    try {
      if (hasBalance) {
        await setBalance(amount);
        toast.success('Base Balance Updated', {
          description: `Base balance updated to $${amount.toFixed(2)}`
        });
      } else {
        await createBalance(amount);
        toast.success('Balance Created', {
          description: `Base balance set to $${amount.toFixed(2)}`
        });
      }
      
      setIsEditing(false);
      setNewBalance('');
      
    } catch (error) {
      console.error('Balance operation error:', error);
      toast.error('Operation Failed', {
        description: error instanceof Error ? error.message : 'Something went wrong'
      });
    } finally {
      setProcessing(false);
    }
  }, [newBalance, hasBalance, setBalance, createBalance]);

  const startEditing = useCallback(() => {
    setNewBalance(hasBalance ? baseBalance.toString() : '');
    setIsEditing(true);
  }, [hasBalance, baseBalance]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleBalanceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBalance(e.target.value);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const showForm = isEditing || !hasBalance;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Current Balance Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <CurrentBalanceDisplay 
              currentBalance={currentBalance}
              hasBalance={hasBalance}
              onEdit={startEditing}
            />

            {hasBalance && (
              <BalanceBreakdown 
                baseBalance={baseBalance}
                tradePnL={tradePnL}
              />
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {!hasBalance && (
                <Button onClick={startEditing}>
                  <Plus className="h-4 w-4 mr-2" />
                  Set Base Balance
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Set/Edit Balance Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {hasBalance ? 'Update Base Balance' : 'Create Base Balance'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasBalance ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                Set your starting/base account balance. Trade P&L will be added automatically.
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                Update your base balance. Your current trade P&L (${tradePnL.toFixed(2)}) will be added automatically.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="balance-input">Base Balance</Label>
              <Input
                id="balance-input"
                type="number"
                step="0.01"
                min="0"
                value={newBalance}
                onChange={handleBalanceChange}
                placeholder="Enter your base account balance"
                className="text-lg"
              />
            </div>

            <BalancePreview newBalance={newBalance} tradePnL={tradePnL} />

            <div className="flex gap-2">
              <Button 
                onClick={handleSetBalance}
                disabled={!newBalance || !isValidAmount || processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : hasBalance ? 'Update Base Balance' : 'Create Base Balance'}
              </Button>
              
              {isEditing && (
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <InfoCard hasBalance={hasBalance} />
    </div>
  );
}