// TradeDetailsView.tsx (shortened for key sections - apply pattern throughout)
'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Edit, 
  Calendar,
  DollarSign,
  Target,
  StopCircle,
  Calculator,
  Tag,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Brain,
  BarChart3,
  Star,
  Lightbulb,
  Eye,
  Heart
} from 'lucide-react';
import { Trade } from '@/lib/types/trades';
import { EditTradeModal } from './EditTradesModal';
import { TradeService } from '@/lib/services/tradeService';
import { toast } from 'sonner';

interface TradeDetailsViewProps {
  trade: Trade;
  onTradeUpdated?: (updatedTrade: Trade) => void;
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
  bullish: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  bearish: 'text-red-600 dark:text-red-400 border-red-500/20',
  sideways: 'text-slate-600 dark:text-slate-400 border-slate-500/20',
  volatile: 'text-orange-600 dark:text-orange-400 border-orange-500/20',
  uncertain: 'text-amber-600 dark:text-amber-400 border-amber-500/20',
  neutral: 'text-slate-600 dark:text-slate-400 border-slate-500/20'
};

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const StatusIcon = memo(({ status }: { status: string }) => {
  const icons = {
    open: <Clock className="h-6 w-6 text-blue-500" />,
    closed: <CheckCircle className="h-6 w-6 text-emerald-500" />,
    cancelled: <XCircle className="h-6 w-6 text-slate-500" />
  };
  return icons[status as keyof typeof icons] || <AlertTriangle className="h-6 w-6 text-amber-500" />;
});

StatusIcon.displayName = 'StatusIcon';

const PerformanceStars = memo(({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
      />
    ))}
    <span className="ml-2 text-sm text-slate-500">
      ({rating}/5)
    </span>
  </div>
));

PerformanceStars.displayName = 'PerformanceStars';

export const TradeDetailsView = memo(function TradeDetailsView({ 
  trade, 
  onTradeUpdated, 
  onTradeDeleted 
}: TradeDetailsViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTrade, setCurrentTrade] = useState<Trade>(trade);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentTrade(trade);
  }, [trade]);

  const formatPrice = useCallback((price: number, symbol: string) => {
    if (symbol.includes('JPY')) return price.toFixed(3);
    if (symbol.includes('XAU') || symbol.includes('GOLD')) return price.toFixed(2);
    return price.toFixed(5);
  }, []);

  const formatQuantity = useCallback((quantity: number) => {
    if (quantity >= 100000) {
      return `${(quantity / 100000).toFixed(2)} lots (${quantity.toLocaleString()} units)`;
    }
    if (quantity >= 10000) {
      return `${(quantity / 10000).toFixed(1)} mini lots (${quantity.toLocaleString()} units)`;
    }
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)} micro lots (${quantity.toLocaleString()} units)`;
    }
    return `${quantity.toLocaleString()} units`;
  }, []);

  const getPipDistance = useCallback((price1: number, price2: number) => {
    const pipSize = currentTrade.symbol.includes('JPY') ? 0.01 : 0.0001;
    return Math.abs(price1 - price2) / pipSize;
  }, [currentTrade.symbol]);

  const statusBadge = useMemo(() => {
    const badges = {
      open: <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 border px-3 py-1">Open Position</Badge>,
      closed: <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border px-3 py-1">Closed</Badge>,
      cancelled: <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border px-3 py-1">Cancelled</Badge>
    };
    return badges[currentTrade.status as keyof typeof badges] || <Badge variant="secondary">{currentTrade.status}</Badge>;
  }, [currentTrade.status]);

  const sideBadge = useMemo(() => {
    const isBuy = currentTrade.side === 'buy' || currentTrade.side === 'long';
    return (
      <Badge className={`px-3 py-1 border ${
        isBuy 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-red-500/10 text-red-400 border-red-500/20'
      }`}>
        {currentTrade.side.toUpperCase()} {isBuy ? '↗' : '↘'}
      </Badge>
    );
  }, [currentTrade.side]);

  const duration = useMemo(() => {
    const loggedDate = new Date(currentTrade.created_at || currentTrade.entry_date);
    const referenceTime = currentTrade.status === 'closed' 
      ? (currentTrade.updated_at ? new Date(currentTrade.updated_at) : currentTime)
      : currentTime;
    
    const diff = referenceTime.getTime() - loggedDate.getTime();
    if (diff < 0) return "Just logged";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const prefix = currentTrade.status === 'closed' ? 'Closed after' : 'Logged';
    const suffix = currentTrade.status === 'closed' ? '' : ' ago';
    
    if (days > 0) {
      const remainingHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return remainingHours > 0 ? `${prefix} ${days} days, ${remainingHours} hours${suffix}` : `${prefix} ${days} days${suffix}`;
    }
    if (hours > 0) {
      const remainingMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return remainingMinutes > 0 ? `${prefix} ${hours} hours, ${remainingMinutes} minutes${suffix}` : `${prefix} ${hours} hours${suffix}`;
    }
    return minutes > 0 ? `${prefix} ${minutes} minutes${suffix}` : "Just logged";
  }, [currentTrade.status, currentTrade.created_at, currentTrade.entry_date, currentTrade.updated_at, currentTime]);

  const pnlPercentage = useMemo(() => {
    if (!currentTrade.profit_loss) return null;
    const positionValue = currentTrade.entry_price * currentTrade.quantity;
    return ((currentTrade.profit_loss / positionValue) * 100).toFixed(2);
  }, [currentTrade.profit_loss, currentTrade.entry_price, currentTrade.quantity]);

  const riskReward = useMemo(() => {
    if (!currentTrade.stop_loss || !currentTrade.take_profit || !currentTrade.entry_price) return null;
    const risk = Math.abs(currentTrade.entry_price - currentTrade.stop_loss);
    const reward = Math.abs(currentTrade.take_profit - currentTrade.entry_price);
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [currentTrade.stop_loss, currentTrade.take_profit, currentTrade.entry_price]);

  const positionValue = useMemo(() => 
    CURRENCY_FORMATTER.format(currentTrade.entry_price * currentTrade.quantity),
    [currentTrade.entry_price, currentTrade.quantity]
  );

  const handleTradeUpdated = useCallback((updatedTrade: Trade) => {
    setCurrentTrade(updatedTrade);
    onTradeUpdated?.(updatedTrade);
  }, [onTradeUpdated]);

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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <StatusIcon status={currentTrade.status} />
              <div>
                <CardTitle className="text-4xl font-bold text-white mb-2">{currentTrade.symbol}</CardTitle>
                <p className="text-sm text-slate-400">
                  Trade #{currentTrade.id?.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {sideBadge}
              {statusBadge}
              <Button onClick={() => setIsEditModalOpen(true)} className="bg-slate-800 hover:bg-slate-700 border-slate-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit Trade
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Psychology & Performance Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <Brain className="h-5 w-5 mr-3 text-purple-500" />
              Psychology Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentTrade.mood && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-slate-400">Trading Mood</span>
                <Badge className={`${MOOD_COLORS[currentTrade.mood as MoodType]} border px-3 py-1`}>
                  <Heart className="h-3.5 w-3.5 mr-2" />
                  {capitalize(currentTrade.mood)}
                </Badge>
              </div>
            )}
            
            {currentTrade.market_sentiment && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-slate-400">Market Sentiment</span>
                <Badge className={`${SENTIMENT_COLORS[currentTrade.market_sentiment as SentimentType]} bg-transparent border px-3 py-1`}>
                  <BarChart3 className="h-3.5 w-3.5 mr-2" />
                  {capitalize(currentTrade.market_sentiment)}
                </Badge>
              </div>
            )}
            
            {currentTrade.performance_rating && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-slate-400">Performance Rating</span>
                <PerformanceStars rating={currentTrade.performance_rating} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* P&L and Performance */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentTrade.profit_loss !== null && currentTrade.status === 'closed' ? (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 border border-slate-700">
                <div className={`flex items-center justify-center mb-4 ${
                  currentTrade.profit_loss >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {currentTrade.profit_loss >= 0 ? (
                    <TrendingUp className="h-10 w-10" />
                  ) : (
                    <TrendingDown className="h-10 w-10" />
                  )}
                </div>
                <p className="text-4xl font-bold mb-2 text-center text-white">
                  {CURRENCY_FORMATTER.format(currentTrade.profit_loss)}
                </p>
                {pnlPercentage && (
                  <p className={`text-xl text-center font-semibold ${
                    currentTrade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {currentTrade.profit_loss >= 0 ? '+' : ''}{pnlPercentage}%
                  </p>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8 border border-blue-500/20">
                <Clock className="h-10 w-10 text-blue-400 mx-auto mb-4" />
                <p className="text-2xl font-bold text-blue-300 text-center mb-2">
                  Open Position
                </p>
                <p className="text-sm text-blue-400 text-center">
                  P&L will be calculated when closed
                </p>
              </div>
            )}

            <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700 text-center">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Position Value</p>
              <p className="text-2xl font-bold text-white">{positionValue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trade Information */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl">Position Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Quantity</p>
              <p className="text-lg font-bold text-white">
                {formatQuantity(currentTrade.quantity)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Entry Price</p>
              <p className="text-lg font-bold text-white">
                {formatPrice(currentTrade.entry_price, currentTrade.symbol)}
              </p>
            </div>

            {currentTrade.exit_price && (
              <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Exit Price</p>
                <p className="text-lg font-bold text-white">
                  {formatPrice(currentTrade.exit_price, currentTrade.symbol)}
                </p>
              </div>
            )}

            <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Duration</p>
              <p className="text-lg font-bold text-white">
                {duration}
              </p>
            </div>
          </div>

          {/* Risk Management */}
          {(currentTrade.stop_loss || currentTrade.take_profit) && (
            <>
              <Separator className="bg-slate-800" />
              <div>
                <h4 className="text-lg font-semibold mb-6 flex items-center text-white">
                  <Target className="h-5 w-5 mr-3 text-blue-500" />
                  Risk Management
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {currentTrade.stop_loss && (
                    <div className="flex items-center justify-between p-5 rounded-xl bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <StopCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Stop Loss</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatPrice(currentTrade.stop_loss, currentTrade.symbol)}</p>
                        <p className="text-xs text-slate-500">
                          {getPipDistance(currentTrade.entry_price, currentTrade.stop_loss).toFixed(1)} pips
                        </p>
                      </div>
                    </div>
                  )}

                  {currentTrade.take_profit && (
                    <div className="flex items-center justify-between p-5 rounded-xl bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Target className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Take Profit</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatPrice(currentTrade.take_profit, currentTrade.symbol)}</p>
                        <p className="text-xs text-slate-500">
                          {getPipDistance(currentTrade.entry_price, currentTrade.take_profit).toFixed(1)} pips
                        </p>
                      </div>
                    </div>
                  )}

                  {riskReward && (
                    <div className="flex items-center justify-between p-5 rounded-xl bg-slate-800/50 border border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Calculator className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-300">Risk:Reward</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">1:{riskReward}</p>
                        <p className="text-xs text-slate-500">Ratio</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Trading Costs */}
          {(currentTrade.fees || currentTrade.commission) && (
            <>
              <Separator className="bg-slate-800" />
              <div>
                <h4 className="text-lg font-semibold mb-6 flex items-center text-white">
                  <DollarSign className="h-5 w-5 mr-3 text-emerald-500" />
                  Trading Costs
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  {currentTrade.fees && (
                    <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700 text-center">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Fees</p>
                      <p className="text-lg font-bold text-white">{CURRENCY_FORMATTER.format(currentTrade.fees)}</p>
                    </div>
                  )}
                  {currentTrade.commission && (
                    <div className="rounded-xl bg-slate-800/50 p-5 border border-slate-700 text-center">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Commission</p>
                      <p className="text-lg font-bold text-white">{CURRENCY_FORMATTER.format(currentTrade.commission)}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Journal Analysis Sections */}
      {(currentTrade.pre_trade_plan || currentTrade.trade_analysis || currentTrade.market_notes) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Eye className="h-5 w-5 mr-3 text-blue-500" />
                Pre-Trade Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentTrade.pre_trade_plan && (
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Trading Plan</p>
                  <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.pre_trade_plan}</p>
                  </div>
                </div>
              )}
              
              {currentTrade.trade_analysis && (
                <div>
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Technical Analysis</p>
                  <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.trade_analysis}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="h-5 w-5 mr-3 text-emerald-500" />
                Market Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTrade.market_notes && (
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Market Notes</p>
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.market_notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Psychology & Learning */}
      {(currentTrade.emotional_state || currentTrade.post_trade_review || currentTrade.lessons_learned) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Heart className="h-5 w-5 mr-3 text-red-500" />
                Emotional Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentTrade.emotional_state && (
                <div>
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3">Pre-Trade Emotions</p>
                  <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.emotional_state}</p>
                  </div>
                </div>
              )}
              
              {currentTrade.post_trade_review && (
                <div>
                  <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3">Post-Trade Reflection</p>
                  <div className="p-5 bg-pink-500/5 border border-pink-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.post_trade_review}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Lightbulb className="h-5 w-5 mr-3 text-amber-500" />
                Key Learnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTrade.lessons_learned && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Lessons Learned</p>
                  <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.lessons_learned}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Calendar className="h-5 w-5 mr-3 text-cyan-500" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="flex items-center gap-5 p-5 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white mb-1">Trade Opened</p>
                <p className="text-sm text-slate-400">{DATETIME_FORMATTER.format(new Date(currentTrade.entry_date))}</p>
              </div>
            </div>
            
            {currentTrade.exit_date && (
              <div className="flex items-center gap-5 p-5 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentTrade.status === 'closed' ? 'bg-blue-500/10' : 'bg-slate-500/10'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    currentTrade.status === 'closed' ? 'bg-blue-500' : 'bg-slate-500'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white mb-1">Trade Closed</p>
                  <p className="text-sm text-slate-400">{DATETIME_FORMATTER.format(new Date(currentTrade.exit_date))}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategy and Notes */}
      {(currentTrade.strategy || currentTrade.setup || currentTrade.notes || (currentTrade.tags && currentTrade.tags.length > 0)) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {(currentTrade.strategy || currentTrade.setup) && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl">Strategy & Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentTrade.strategy && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Strategy</p>
                    <p className="text-lg text-white font-medium">{currentTrade.strategy}</p>
                  </div>
                )}
                {currentTrade.setup && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Setup</p>
                    <p className="text-lg text-white font-medium">{currentTrade.setup}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Tag className="h-5 w-5 mr-3 text-indigo-500" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentTrade.tags && currentTrade.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTrade.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm px-3 py-1 bg-slate-800/50 border-slate-700 text-slate-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {currentTrade.notes && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Notes
                  </p>
                  <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentTrade.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      <EditTradeModal
        trade={currentTrade}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTradeUpdated={handleTradeUpdated}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">Delete Trade</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 leading-relaxed">
              Are you sure you want to delete this trade ({currentTrade.symbol})? 
              This action cannot be undone and will permanently remove all trade data including:
              <br /><br />
              <span className="text-slate-300">• Trade details and pricing information</span><br />
              <span className="text-slate-300">• Notes and strategy information</span><br />
              <span className="text-slate-300">• Tags and setup details</span><br />
              <span className="text-slate-300">• All journal entries and psychological data</span><br />
              <span className="text-slate-300">• All historical data for this trade</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700">
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
    </div>
  );
});