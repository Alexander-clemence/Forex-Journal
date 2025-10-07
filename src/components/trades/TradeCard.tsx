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

interface TradeCardProps {
  trade: Trade;
  onTradeDeleted?: () => void;
}

type MoodType = 'confident' | 'analytical' | 'cautious' | 'frustrated' | 'disappointed' | 'excited' | 'focused' | 'nervous' | 'optimistic' | 'neutral' | 'anxious';
type SentimentType = 'bullish' | 'bearish' | 'sideways' | 'volatile' | 'uncertain' | 'neutral';

const MOOD_COLORS: Record<MoodType, string> = {
  confident: 'bg-green-100 text-green-800',
  analytical: 'bg-blue-100 text-blue-800',
  cautious: 'bg-yellow-100 text-yellow-800',
  frustrated: 'bg-red-100 text-red-800',
  disappointed: 'bg-red-100 text-red-800',
  excited: 'bg-purple-100 text-purple-800',
  focused: 'bg-indigo-100 text-indigo-800',
  nervous: 'bg-orange-100 text-orange-800',
  optimistic: 'bg-emerald-100 text-emerald-800',
  neutral: 'bg-gray-100 text-gray-800',
  anxious: 'bg-orange-100 text-orange-800'
};

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  bullish: 'text-green-600',
  bearish: 'text-red-600',
  sideways: 'text-gray-600',
  volatile: 'text-orange-600',
  uncertain: 'text-yellow-600',
  neutral: 'text-gray-600'
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
      open: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', text: 'Open' },
      closed: { variant: 'secondary' as const, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', text: 'Closed' },
      cancelled: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', text: 'Cancelled' }
    };
    return configs[currentTrade.status] || { variant: 'secondary' as const, className: '', text: currentTrade.status };
  }, [currentTrade.status]);

  const sideBadgeConfig = useMemo(() => {
    const isBuy = currentTrade.side === 'buy' || currentTrade.side === 'long';
    return {
      className: isBuy 
        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      text: currentTrade.side.toUpperCase()
    };
  }, [currentTrade.side]);

  const pnlDisplay = useMemo(() => {
    if (currentTrade.status === 'open' || !currentTrade.profit_loss) {
      return {
        isOpen: true,
        color: 'text-gray-500 dark:text-gray-400',
        icon: Clock,
        text: 'Open Position'
      };
    }

    const isProfit = currentTrade.profit_loss > 0;
    const percentage = ((currentTrade.profit_loss / (currentTrade.entry_price * currentTrade.quantity)) * 100);

    return {
      isOpen: false,
      isProfit,
      color: isProfit ? 'text-green-600' : 'text-red-600',
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
      
      if (days > 0) return `Closed after ${days} days`;
      if (hours > 0) return `Closed after ${hours} hours`;
      return 'Closed recently';
    }
    
    const diffTime = currentTime.getTime() - loggedDate.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffTime / (1000 * 60 * 60));
    const minutes = Math.floor(diffTime / (1000 * 60));
    
    if (days > 0) return `Logged ${days} days ago`;
    if (hours > 0) return `Logged ${hours} hours ago`;
    if (minutes > 0) return `Logged ${minutes} minutes ago`;
    return 'Just logged';
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
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Main trade info */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentTrade.symbol}
                </h3>
                <Badge variant={sideBadgeConfig.className as any} className={sideBadgeConfig.className}>
                  {sideBadgeConfig.text}
                </Badge>
                <Badge variant={statusBadgeConfig.variant} className={statusBadgeConfig.className}>
                  {statusBadgeConfig.text}
                </Badge>
              </div>
              
              {/* Journal badges */}
              <div className="flex items-center space-x-2">
                {currentTrade.mood && (
                  <Badge className={MOOD_COLORS[currentTrade.mood as MoodType] || 'bg-gray-100 text-gray-800'}>
                    <Brain className="h-3 w-3 mr-1" />
                    {currentTrade.mood.charAt(0).toUpperCase() + currentTrade.mood.slice(1)}
                  </Badge>
                )}
                {currentTrade.market_sentiment && (
                  <Badge variant="outline" className={SENTIMENT_COLORS[currentTrade.market_sentiment as SentimentType] || 'text-gray-600'}>
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {currentTrade.market_sentiment.charAt(0).toUpperCase() + currentTrade.market_sentiment.slice(1)}
                  </Badge>
                )}
                {currentTrade.performance_rating && (
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < currentTrade.performance_rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {currentTrade.strategy && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {currentTrade.strategy}
                  </span>
                </div>
              )}
            </div>

            {/* Trade details */}
            <div className="hidden md:flex items-center space-x-8 border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Quantity</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatQuantity(currentTrade.quantity)}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Entry Price</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(currentTrade.entry_price, currentTrade.symbol)}
                </p>
              </div>

              {currentTrade.exit_price && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Exit Price</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(currentTrade.exit_price, currentTrade.symbol)}
                  </p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Position Value</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {positionValue}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {duration}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - P&L and Actions */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              {pnlDisplay.isOpen ? (
                <div className={`flex items-center ${pnlDisplay.color}`}>
                  <pnlDisplay.icon className="h-4 w-4 mr-1" />
                  <span className="text-sm">{pnlDisplay.text}</span>
                </div>
              ) : (
                <div className={`flex items-center ${pnlDisplay.color}`}>
                  <pnlDisplay.icon className="h-4 w-4 mr-2" />
                  <div className="text-right">
                    <div className="text-lg font-bold">{pnlDisplay.amount}</div>
                    <div className="text-sm opacity-80">{pnlDisplay.percentage}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>

              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile view - Additional details */}
        <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Quantity: </span>
              <span className="font-medium">{formatQuantity(currentTrade.quantity)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Entry: </span>
              <span className="font-medium">{formatPrice(currentTrade.entry_price, currentTrade.symbol)}</span>
            </div>
            {currentTrade.exit_price && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Exit: </span>
                <span className="font-medium">{formatPrice(currentTrade.exit_price, currentTrade.symbol)}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-400">Duration: </span>
              <span className="font-medium">{duration}</span>
            </div>
          </div>
        </div>

        {/* Bottom section - Dates, Notes, and Journal insights */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Entry: {DATE_FORMATTER.format(new Date(currentTrade.entry_date))}</span>
              </div>
              {currentTrade.exit_date && (
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Exit: {DATE_FORMATTER.format(new Date(currentTrade.exit_date))}</span>
                </div>
              )}
            </div>

            {currentTrade.tags && currentTrade.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                {currentTrade.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {currentTrade.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{currentTrade.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Journal content preview */}
          {(currentTrade.lessons_learned || currentTrade.market_notes || currentTrade.pre_trade_plan) && (
            <div className="mt-3 space-y-2">
              {currentTrade.pre_trade_plan && (
                <div className="text-sm">
                  <span className="font-medium text-blue-600">Plan:</span>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-1">
                    {currentTrade.pre_trade_plan}
                  </p>
                </div>
              )}
              
              {currentTrade.lessons_learned && (
                <div className="text-sm">
                  <span className="font-medium text-green-600">Lessons:</span>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-1">
                    {currentTrade.lessons_learned}
                  </p>
                </div>
              )}

              {currentTrade.market_notes && (
                <div className="text-sm">
                  <span className="font-medium text-purple-600">Market:</span>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-1">
                    {currentTrade.market_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentTrade.notes && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {currentTrade.notes}
              </p>
            </div>
          )}
        </div>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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