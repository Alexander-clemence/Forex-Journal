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
  MoreVertical
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
  confident: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
  analytical: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900',
  cautious: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900',
  frustrated: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
  disappointed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
  excited: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900',
  focused: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900',
  nervous: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900',
  optimistic: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800',
  anxious: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900'
};

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  bullish: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  bearish: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  sideways: 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  volatile: 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  uncertain: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  neutral: 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
};

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
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
    if (quantity >= 10000) return `${(quantity / 10000).toFixed(1)} mini lots`;
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(1)} micro lots`;
    return `${quantity.toLocaleString()} units`;
  }, []);

  const statusBadgeConfig = useMemo(() => {
    const configs = {
      open: { 
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900', 
        text: 'Open' 
      },
      closed: { 
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900', 
        text: 'Closed' 
      },
      cancelled: { 
        className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800', 
        text: 'Cancelled' 
      }
    };
    return configs[currentTrade.status] || { className: '', text: currentTrade.status };
  }, [currentTrade.status]);

  const sideBadgeConfig = useMemo(() => {
    const isBuy = currentTrade.side === 'buy' || currentTrade.side === 'long';
    return {
      className: isBuy 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900'
        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
      text: currentTrade.side.toUpperCase()
    };
  }, [currentTrade.side]);

  const pnlDisplay = useMemo(() => {
    if (currentTrade.status === 'open' || !currentTrade.profit_loss) {
      return {
        isOpen: true,
        color: 'text-slate-600 dark:text-slate-400',
        icon: Clock,
        text: 'Open Position'
      };
    }

    const isProfit = currentTrade.profit_loss > 0;
    const percentage = ((currentTrade.profit_loss / (currentTrade.entry_price * currentTrade.quantity)) * 100);

    return {
      isOpen: false,
      isProfit,
      color: isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      icon: isProfit ? TrendingUp : TrendingDown,
      amount: CURRENCY_FORMATTER.format(currentTrade.profit_loss),
      percentage: `${isProfit ? '+' : ''}${percentage.toFixed(2)}%`
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
      return 'Recently';
    }
    
    const diffTime = currentTime.getTime() - loggedDate.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffTime / (1000 * 60 * 60));
    const minutes = Math.floor(diffTime / (1000 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Now';
  }, [currentTrade.status, currentTrade.created_at, currentTrade.entry_date, currentTrade.updated_at, currentTime]);

  const positionValue = useMemo(() => 
    CURRENCY_FORMATTER.format(currentTrade.entry_price * currentTrade.quantity),
    [currentTrade.entry_price, currentTrade.quantity]
  );

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
    <Card className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300">
      {/* Colored accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        currentTrade.status === 'open' 
          ? 'bg-blue-500' 
          : pnlDisplay.isProfit 
            ? 'bg-emerald-500' 
            : 'bg-red-500'
      }`} />
      
      <CardContent className="p-5 sm:p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Left: Symbol and Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                {currentTrade.symbol}
              </h3>
              <Badge className={`${sideBadgeConfig.className} border font-medium px-2.5 py-0.5 text-xs`}>
                {sideBadgeConfig.text}
              </Badge>
              <Badge className={`${statusBadgeConfig.className} border font-medium px-2.5 py-0.5 text-xs`}>
                {statusBadgeConfig.text}
              </Badge>
            </div>
            
            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {currentTrade.mood && (
                <Badge className={`${MOOD_COLORS[currentTrade.mood as MoodType]} border text-xs font-medium px-2 py-0.5`}>
                  <Brain className="h-3 w-3 mr-1" />
                  {currentTrade.mood.charAt(0).toUpperCase() + currentTrade.mood.slice(1)}
                </Badge>
              )}
              {currentTrade.market_sentiment && (
                <Badge className={`${SENTIMENT_COLORS[currentTrade.market_sentiment as SentimentType]} bg-transparent border text-xs font-medium px-2 py-0.5`}>
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {currentTrade.market_sentiment.charAt(0).toUpperCase() + currentTrade.market_sentiment.slice(1)}
                </Badge>
              )}
              {currentTrade.performance_rating && (
                <div className="flex items-center gap-0.5" role="img" aria-label={`${currentTrade.performance_rating} out of 5 stars`}>
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
            
            {currentTrade.strategy && (
              <div className="mt-2">
                <span className="inline-flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                  {currentTrade.strategy}
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsModalOpen(true)}
                className="h-8 px-3 text-xs font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 px-3 text-xs font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="h-8 px-2.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Mobile dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="sm:hidden">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setIsModalOpen(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Trade
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-5 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Quantity</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {formatQuantity(currentTrade.quantity)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Entry</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {formatPrice(currentTrade.entry_price, currentTrade.symbol)}
            </p>
          </div>

          {currentTrade.exit_price && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Exit</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatPrice(currentTrade.exit_price, currentTrade.symbol)}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Position</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {positionValue}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Duration</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {duration}
            </p>
          </div>
        </div>

        {/* P&L Display */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Entry: {DATE_FORMATTER.format(new Date(currentTrade.entry_date))}</span>
            </div>
            {currentTrade.exit_date && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Exit: {DATE_FORMATTER.format(new Date(currentTrade.exit_date))}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pnlDisplay.isOpen ? (
              <div className={`flex items-center gap-1.5 ${pnlDisplay.color} text-sm font-medium`}>
                <pnlDisplay.icon className="h-4 w-4" />
                <span>{pnlDisplay.text}</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 ${pnlDisplay.color}`}>
                <pnlDisplay.icon className="h-5 w-5" />
                <div className="text-right">
                  <div className="text-lg font-bold leading-tight">{pnlDisplay.amount}</div>
                  <div className="text-xs font-medium opacity-90">{pnlDisplay.percentage}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {currentTrade.tags && currentTrade.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {currentTrade.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs font-normal px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                {tag}
              </Badge>
            ))}
            {currentTrade.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs font-normal px-2 py-0.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              >
                +{currentTrade.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Journal Preview */}
        {(currentTrade.lessons_learned || currentTrade.market_notes || currentTrade.pre_trade_plan) && (
          <div className="space-y-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3.5 border border-slate-200 dark:border-slate-800">
            {currentTrade.pre_trade_plan && (
              <div className="text-sm space-y-1">
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wide">Plan</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-1 leading-relaxed">
                  {currentTrade.pre_trade_plan}
                </p>
              </div>
            )}
            
            {currentTrade.lessons_learned && (
              <div className="text-sm space-y-1">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wide">Lessons</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-1 leading-relaxed">
                  {currentTrade.lessons_learned}
                </p>
              </div>
            )}

            {currentTrade.market_notes && (
              <div className="text-sm space-y-1">
                <span className="font-semibold text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wide">Market</span>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-1 leading-relaxed">
                  {currentTrade.market_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* General Notes */}
        {currentTrade.notes && !currentTrade.pre_trade_plan && !currentTrade.lessons_learned && !currentTrade.market_notes && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3.5 border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {currentTrade.notes}
            </p>
          </div>
        )}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade ({currentTrade.symbol})? 
              This action cannot be undone and will permanently remove all trade data including journal entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Trade
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}