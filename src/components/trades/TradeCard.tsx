'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Edit, 
  Eye, 
  Calendar, 
  Trash2, 
  Brain,
  BarChart3,
  Star,
  MoreVertical,
  ChevronRight
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TradeService } from '@/lib/services/tradeService';
import { toast } from 'sonner';

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

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

export function TradeCard({ trade, onTradeDeleted }: TradeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTrade, setCurrentTrade] = useState<Trade>(trade);

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

  const statusConfig = useMemo(() => {
    const configs = {
      open: { 
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        text: 'Open'
      },
      closed: { 
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: 'Closed'
      },
      cancelled: { 
        className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        text: 'Cancelled'
      }
    };
    return configs[currentTrade.status] || configs.open;
  }, [currentTrade.status]);

  const sideConfig = useMemo(() => {
    const isBuy = currentTrade.side === 'buy' || currentTrade.side === 'long';
    return {
      gradient: isBuy ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500',
      className: isBuy 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20',
      text: currentTrade.side.toUpperCase(),
      icon: isBuy ? '↗' : '↘'
    };
  }, [currentTrade.side]);

  const pnlDisplay = useMemo(() => {
    if (currentTrade.status === 'open' || !currentTrade.profit_loss) {
      return {
        isOpen: true,
        color: 'text-slate-500 dark:text-slate-400',
        icon: Clock,
        text: 'Active'
      };
    }

    const isProfit = currentTrade.profit_loss > 0;
    const percentage = ((currentTrade.profit_loss / (currentTrade.entry_price * currentTrade.quantity)) * 100);

    return {
      isOpen: false,
      isProfit,
      color: isProfit ? 'text-emerald-500' : 'text-red-500',
      icon: isProfit ? TrendingUp : TrendingDown,
      amount: CURRENCY_FORMATTER.format(Math.abs(currentTrade.profit_loss)),
      percentage: `${isProfit ? '+' : '-'}${Math.abs(percentage).toFixed(2)}%`
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
      window.location.reload();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete trade. Please try again.'
      });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [currentTrade.id]);

  const handleTradeUpdated = useCallback((updatedTrade: Trade) => {
    setCurrentTrade(updatedTrade);
  }, []);

  return (
    <Card className="group relative overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 transition-all duration-300">
      {/* Status indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${sideConfig.gradient}`} />
      
      <CardContent className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {currentTrade.symbol}
            </h3>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${sideConfig.className} border text-xs font-bold`}>
              <span>{sideConfig.icon}</span>
              <span>{sideConfig.text}</span>
            </div>
            <Badge className={`${statusConfig.className} border text-xs px-2 py-0.5`}>
              {statusConfig.text}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsModalOpen(true)}
              className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 bg-slate-900 border-slate-800">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)} className="text-slate-300 focus:bg-slate-800">
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-400 focus:bg-red-950 focus:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadata Pills - Compact */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {currentTrade.mood && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${MOOD_COLORS[currentTrade.mood as MoodType]} border text-xs`}>
              <Brain className="h-3 w-3" />
              <span>{currentTrade.mood.charAt(0).toUpperCase() + currentTrade.mood.slice(1)}</span>
            </div>
          )}
          {currentTrade.market_sentiment && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/30 border border-slate-700 ${SENTIMENT_COLORS[currentTrade.market_sentiment as SentimentType]} text-xs`}>
              <BarChart3 className="h-3 w-3" />
              <span>{currentTrade.market_sentiment.charAt(0).toUpperCase() + currentTrade.market_sentiment.slice(1)}</span>
            </div>
          )}
          {currentTrade.performance_rating && (
            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              {Array.from({ length: 5 }, (_, i) => (
                <Star 
                  key={i} 
                  className={`h-2.5 w-2.5 ${
                    i < currentTrade.performance_rating! 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          )}
          {currentTrade.strategy && (
            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
              {currentTrade.strategy}
            </div>
          )}
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="rounded-lg bg-slate-800/30 p-2 border border-slate-700/50">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Quantity</p>
            <p className="text-xs font-semibold text-slate-200">{formatQuantity(currentTrade.quantity)}</p>
          </div>

          <div className="rounded-lg bg-slate-800/30 p-2 border border-slate-700/50">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Entry</p>
            <p className="text-xs font-semibold text-slate-200">{formatPrice(currentTrade.entry_price, currentTrade.symbol)}</p>
          </div>

          {currentTrade.exit_price ? (
            <div className="rounded-lg bg-slate-800/30 p-2 border border-slate-700/50">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Exit</p>
              <p className="text-xs font-semibold text-slate-200">{formatPrice(currentTrade.exit_price, currentTrade.symbol)}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-800/30 p-2 border border-slate-700/50">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Exit</p>
              <p className="text-xs font-semibold text-slate-600">—</p>
            </div>
          )}

          <div className="rounded-lg bg-slate-800/30 p-2 border border-slate-700/50">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Duration</p>
            <p className="text-xs font-semibold text-slate-200">{duration}</p>
          </div>
        </div>

        {/* Compact P&L Display */}
        <div className="flex items-center justify-between rounded-lg bg-slate-800/30 border border-slate-700/50 p-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-slate-900/50 ${pnlDisplay.color}`}>
              <pnlDisplay.icon className="h-4 w-4" />
            </div>
            <div>
              {pnlDisplay.isOpen ? (
                <>
                  <p className={`text-sm font-bold ${pnlDisplay.color}`}>{pnlDisplay.text}</p>
                  <p className="text-xs text-slate-500">P&L pending</p>
                </>
              ) : (
                <>
                  <p className={`text-base font-bold ${pnlDisplay.color}`}>
                    {pnlDisplay.isProfit ? '+' : '-'}{pnlDisplay.amount}
                  </p>
                  <p className={`text-xs font-medium ${pnlDisplay.color} opacity-80`}>
                    {pnlDisplay.percentage}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>{DATE_FORMATTER.format(new Date(currentTrade.entry_date))}</span>
          </div>
        </div>

        {/* Compact View Details Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all group/cta"
        >
          <span>View Full Details</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
        </button>
      </CardContent>

      <TradeDetailsModal
        trade={currentTrade}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTradeUpdated={handleTradeUpdated}
        onTradeDeleted={onTradeDeleted}
      />

      <EditTradeModal
        trade={currentTrade}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTradeUpdated={handleTradeUpdated}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Trade</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this trade ({currentTrade.symbol})? 
              This action cannot be undone and will permanently remove all trade data including journal entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700">
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