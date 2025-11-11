'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Eye, 
  Trash2, 
  Brain,
  BarChart3,
  Star
} from 'lucide-react';
import { Trade } from '@/lib/types/trades';
import { TradeDetailsModal } from './TradeDetailsModal';
import { EditTradeModal } from './EditTradesModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TradeService } from '@/lib/services/tradeService';
import { toast } from 'sonner';
import { useTradeModalStore } from '@/lib/stores/tradeModalStore';
import { useShallow } from 'zustand/react/shallow';

interface TradeCardProps {
  trade: Trade;
  onTradeDeleted?: () => void;
}

type MoodType = 'confident' | 'analytical' | 'cautious' | 'frustrated' | 'disappointed' | 'excited' | 'focused' | 'nervous' | 'optimistic' | 'neutral' | 'anxious';
type SentimentType = 'bullish' | 'bearish' | 'sideways' | 'volatile' | 'uncertain' | 'neutral';

const MOOD_COLORS: Record<MoodType, string> = {
  confident: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  analytical: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  cautious: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  frustrated: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  disappointed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  excited: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  focused: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  nervous: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  optimistic: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  anxious: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
};

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  bullish: 'text-emerald-600 dark:text-emerald-400',
  bearish: 'text-red-600 dark:text-red-400',
  sideways: 'text-slate-600 dark:text-slate-400',
  volatile: 'text-orange-600 dark:text-orange-400',
  uncertain: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-slate-600 dark:text-slate-400'
};

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function TradeCard({ trade, onTradeDeleted }: TradeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTrade, setCurrentTrade] = useState<Trade>(trade);

  const {
    viewTradeId,
    editTradeId,
    deleteTradeId,
    openView,
    openEdit,
    openDelete,
    closeView,
    closeEdit,
    closeDelete,
  } = useTradeModalStore(useShallow((state) => ({
    viewTradeId: state.viewTradeId,
    editTradeId: state.editTradeId,
    deleteTradeId: state.deleteTradeId,
    openView: state.openView,
    openEdit: state.openEdit,
    openDelete: state.openDelete,
    closeView: state.closeView,
    closeEdit: state.closeEdit,
    closeDelete: state.closeDelete,
  })));

  const isViewOpen = currentTrade.id ? viewTradeId === currentTrade.id : false;
  const isEditOpen = currentTrade.id ? editTradeId === currentTrade.id : false;
  const isDeleteOpen = currentTrade.id ? deleteTradeId === currentTrade.id : false;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = useCallback((price: number, symbol: string) => {
    if (symbol.includes('JPY')) return price.toFixed(3);
    if (symbol.includes('XAU') || symbol.includes('GOLD')) return price.toFixed(2);
    return price.toFixed(5);
  }, []);

  const formatQuantity = useCallback((quantity: number) => {
    if (quantity >= 100000) return `${(quantity / 100000).toFixed(2)} lots`;
    if (quantity >= 10000) return `${(quantity / 10000).toFixed(1)} mini`;
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(1)} micro`;
    return `${quantity.toLocaleString()}`;
  }, []);

  const sideConfig = useMemo(() => {
    const isBuy = currentTrade.side === 'buy' || currentTrade.side === 'long';
    return {
      className: isBuy 
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      text: isBuy ? 'BUY' : 'SELL'
    };
  }, [currentTrade.side]);

  const statusBadge = useMemo(() => {
    const configs = {
      open: { className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', text: 'Open' },
      closed: { className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', text: 'Closed' },
      cancelled: { className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', text: 'Cancelled' }
    };
    return configs[currentTrade.status] || configs.open;
  }, [currentTrade.status]);

  const pnlDisplay = useMemo(() => {
    if (currentTrade.status === 'open' || !currentTrade.profit_loss) {
      return {
        isOpen: true,
        color: 'text-slate-600 dark:text-slate-400',
        text: 'Open Position',
        showArrow: false
      };
    }

    const isProfit = currentTrade.profit_loss > 0;
    const percentage = ((currentTrade.profit_loss / (currentTrade.entry_price * currentTrade.quantity)) * 100);

    return {
      isOpen: false,
      isProfit,
      color: isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      amount: CURRENCY_FORMATTER.format(Math.abs(currentTrade.profit_loss)),
      percentage: `${Math.abs(percentage).toFixed(2)}%`,
      showArrow: true
    };
  }, [currentTrade.status, currentTrade.profit_loss, currentTrade.entry_price, currentTrade.quantity]);

  const duration = useMemo(() => {
    const loggedDate = new Date(currentTrade.created_at || currentTrade.entry_date);
    
    if (currentTrade.status === 'closed') {
      const closedDate = currentTrade.updated_at ? new Date(currentTrade.updated_at) : currentTime;
      const duration = closedDate.getTime() - loggedDate.getTime();
      const days = Math.floor(duration / (1000 * 60 * 60 * 24));
      const hours = Math.floor(duration / (1000 * 60 * 60));
      
      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
      return '<1h';
    }
    
    const diffTime = currentTime.getTime() - loggedDate.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return '<1h ago';
  }, [currentTrade.status, currentTrade.created_at, currentTrade.entry_date, currentTrade.updated_at, currentTime]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!currentTrade.id) return;

    setIsDeleting(true);
    try {
      await TradeService.deleteTrade(currentTrade.id);
      toast.success('Trade Deleted', {
        description: 'The trade has been permanently deleted.'
      });
      closeDelete();
      window.location.reload();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete trade. Please try again.'
      });
      setIsDeleting(false);
      closeDelete();
    }
  }, [currentTrade.id, closeDelete]);

  const handleTradeUpdated = useCallback((updatedTrade: Trade) => {
    setCurrentTrade(updatedTrade);
  }, []);

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">#{currentTrade.id?.slice(-6).toUpperCase()}</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentTrade.symbol}</h3>
            <Badge className={`${sideConfig.className} border text-xs px-2 py-0`}>
              {sideConfig.text}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => currentTrade.id && openView(currentTrade.id)}
              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => currentTrade.id && openEdit(currentTrade.id)}
              className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Edit Trade"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => currentTrade.id && openDelete(currentTrade.id)}
              className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400"
              title="Delete Trade"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Metrics Row */}
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            {pnlDisplay.showArrow && (
              <div className={`absolute -left-12 top-0 ${pnlDisplay.color} opacity-10`}>
                {pnlDisplay.isProfit ? (
                  <TrendingUp className="h-20 w-20" strokeWidth={1} />
                ) : (
                  <TrendingDown className="h-20 w-20" strokeWidth={1} />
                )}
              </div>
            )}
            <div className="relative z-10">
              <div className={`text-3xl font-bold ${pnlDisplay.color} mb-1`}>
                {pnlDisplay.isOpen ? 'Open' : (pnlDisplay.isProfit ? '+' : '-') + pnlDisplay.amount}
              </div>
              {!pnlDisplay.isOpen && (
                <div className={`text-sm ${pnlDisplay.color}`}>
                  {pnlDisplay.isProfit ? '▲' : '▼'} {pnlDisplay.percentage}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-slate-900 dark:text-white font-semibold mb-1">
              {formatQuantity(currentTrade.quantity)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Quantity
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Entry</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatPrice(currentTrade.entry_price, currentTrade.symbol)}
            </div>
          </div>

          {currentTrade.exit_price ? (
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Exit</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatPrice(currentTrade.exit_price, currentTrade.symbol)}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
              <Badge className={`${statusBadge.className} text-xs px-2 py-0`}>
                {statusBadge.text}
              </Badge>
            </div>
          )}

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Duration</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {duration}
            </div>
          </div>
        </div>

        {/* Strategy & Metadata */}
        {(currentTrade.strategy || currentTrade.mood || currentTrade.market_sentiment) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            {currentTrade.strategy && (
              <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentTrade.strategy}
              </span>
            )}
            {currentTrade.mood && (
              <Badge className={`${MOOD_COLORS[currentTrade.mood as MoodType]} border text-xs px-2 py-0.5`}>
                <Brain className="h-3 w-3 mr-1" />
                {currentTrade.mood.charAt(0).toUpperCase() + currentTrade.mood.slice(1)}
              </Badge>
            )}
            {currentTrade.market_sentiment && (
              <Badge className={`bg-transparent border border-slate-300 dark:border-slate-700 ${SENTIMENT_COLORS[currentTrade.market_sentiment as SentimentType]} text-xs px-2 py-0.5`}>
                <BarChart3 className="h-3 w-3 mr-1" />
                {currentTrade.market_sentiment.charAt(0).toUpperCase() + currentTrade.market_sentiment.slice(1)}
              </Badge>
            )}
            {currentTrade.performance_rating && (
              <div className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${
                      i < currentTrade.performance_rating! 
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <TradeDetailsModal
        trade={currentTrade}
        isOpen={isViewOpen}
        onClose={closeView}
        onTradeUpdated={handleTradeUpdated}
        onTradeDeleted={onTradeDeleted}
      />

      <EditTradeModal
        trade={currentTrade}
        isOpen={isEditOpen}
        onClose={closeEdit}
        onTradeUpdated={handleTradeUpdated}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => {
        if (open) {
          currentTrade.id && openDelete(currentTrade.id);
        } else {
          closeDelete();
        }
      }}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Trade</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this trade ({currentTrade.symbol})? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700" onClick={closeDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}