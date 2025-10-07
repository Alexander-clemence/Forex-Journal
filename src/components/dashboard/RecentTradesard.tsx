'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Trade } from '@/lib/types/trades';
import { TradeDetailsModal } from '../trades/TradeDetailsModal';


interface RecentTradesCardProps {
  trades: Trade[];
  onTradeDeleted?: () => void;
}

// Memoized Status Badge Component
const StatusBadge = memo(({ status }: { status: string }) => {
  const badgeConfig = useMemo(() => {
    switch (status) {
      case 'open':
        return { className: 'bg-blue-100 text-blue-700', label: 'Open' };
      case 'closed':
        return { className: 'bg-green-100 text-green-700', label: 'Closed' };
      case 'cancelled':
        return { className: 'bg-gray-100 text-gray-700', label: 'Cancelled' };
      default:
        return { className: '', label: status };
    }
  }, [status]);

  return (
    <Badge variant="secondary" className={badgeConfig.className}>
      {badgeConfig.label}
    </Badge>
  );
});
StatusBadge.displayName = 'StatusBadge';

// Memoized PnL Display Component
const PnLDisplay = memo(({ trade }: { trade: Trade }) => {
  const pnlInfo = useMemo(() => {
    if (trade.status === 'open' || !trade.profit_loss) {
      return { type: 'open' };
    }
    
    const isProfit = trade.profit_loss > 0;
    return {
      type: isProfit ? 'profit' : 'loss',
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(trade.profit_loss)
    };
  }, [trade.status, trade.profit_loss]);

  if (pnlInfo.type === 'open') {
    return (
      <div className="flex items-center text-gray-500">
        <Clock className="h-3 w-3 mr-1" />
        <span className="text-xs">Open</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${pnlInfo.type === 'profit' ? 'text-green-600' : 'text-red-600'}`}>
      {pnlInfo.type === 'profit' ? (
        <TrendingUp className="h-3 w-3 mr-1" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-1" />
      )}
      <span className="text-sm font-medium">{pnlInfo.amount}</span>
    </div>
  );
});
PnLDisplay.displayName = 'PnLDisplay';

// Memoized Trade Item Component
const TradeItem = memo(({ 
  trade, 
  onClick, 
  currentTime 
}: { 
  trade: Trade; 
  onClick: (trade: Trade) => void;
  currentTime: Date;
}) => {
  const formattedQuantity = useMemo(() => {
    const quantity = trade.quantity;
    if (quantity >= 100000) {
      return `${(quantity / 100000).toFixed(2)} lots`;
    } else if (quantity >= 10000) {
      return `${(quantity / 10000).toFixed(1)} mini lots`;
    } else if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)} micro lots`;
    }
    return `${quantity.toLocaleString()} units`;
  }, [trade.quantity]);

  const formattedPrice = useMemo(() => {
    const { entry_price, symbol } = trade;
    if (symbol.includes('JPY')) {
      return entry_price.toFixed(3);
    } else if (symbol.includes('XAU') || symbol.includes('GOLD')) {
      return entry_price.toFixed(2);
    } else if (symbol.includes('XAG') || symbol.includes('SILVER')) {
      return entry_price.toFixed(3);
    } else if (symbol.includes('OIL') || symbol.includes('WTI') || symbol.includes('BRENT')) {
      return entry_price.toFixed(2);
    }
    return entry_price.toFixed(5);
  }, [trade.entry_price, trade.symbol]);

  const timestamp = useMemo(() => {
    const loggedDate = new Date(trade.created_at || trade.entry_date);
    
    if (trade.status === 'closed') {
      const closedDate = trade.updated_at ? new Date(trade.updated_at) : currentTime;
      const duration = closedDate.getTime() - loggedDate.getTime();
      const diffDays = Math.floor(duration / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(duration / (1000 * 60 * 60));
      
      if (diffDays > 0) return `Closed ${diffDays}d ago`;
      if (diffHours > 0) return `Closed ${diffHours}h ago`;
      return 'Closed recently';
    }
    
    if (trade.status === 'cancelled') {
      const cancelledDate = trade.updated_at ? new Date(trade.updated_at) : currentTime;
      const duration = cancelledDate.getTime() - loggedDate.getTime();
      const diffDays = Math.floor(duration / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(duration / (1000 * 60 * 60));
      
      if (diffDays > 0) return `Cancelled ${diffDays}d ago`;
      if (diffHours > 0) return `Cancelled ${diffHours}h ago`;
      return 'Cancelled recently';
    }
    
    const diffTime = currentTime.getTime() - loggedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  }, [trade, currentTime]);

  const handleClick = useCallback(() => {
    onClick(trade);
  }, [onClick, trade]);

  const isLong = trade.side === 'buy' || trade.side === 'long';

  return (
    <button
      onClick={handleClick}
      className="w-full block hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-colors border text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
              isLong ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isLong ? 'B' : 'S'}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {trade.symbol}
              </p>
              <StatusBadge status={trade.status} />
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-xs text-gray-500">
                {formattedQuantity} @ {formattedPrice}
              </p>
              <p className="text-xs text-gray-400">
                {timestamp}
              </p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <PnLDisplay trade={trade} />
        </div>
      </div>
    </button>
  );
});
TradeItem.displayName = 'TradeItem';

// Memoized Empty State Component
const EmptyState = memo(() => (
  <div className="text-center py-8">
    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      No trades yet
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-4">
      Start by adding your first trade to track your performance.
    </p>
    <Link href="/dashboard/trades/new">
      <Button>Add Your First Trade</Button>
    </Link>
  </div>
));
EmptyState.displayName = 'EmptyState';

export const RecentTradesCard = memo(({ trades, onTradeDeleted }: RecentTradesCardProps) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for real-time duration updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleTradeClick = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  }, []);

  const handleTradeDeleted = useCallback(() => {
    handleCloseModal();
    onTradeDeleted?.();
  }, [handleCloseModal, onTradeDeleted]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trades</CardTitle>
        <Link href="/dashboard/trades">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.map((trade) => (
            <TradeItem
              key={trade.id}
              trade={trade}
              onClick={handleTradeClick}
              currentTime={currentTime}
            />
          ))}
        </div>

        {/* Trade Details Modal */}
        {selectedTrade && (
          <TradeDetailsModal
            trade={selectedTrade}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onTradeDeleted={handleTradeDeleted}
          />
        )}
      </CardContent>
    </Card>
  );
});
RecentTradesCard.displayName = 'RecentTradesCard';