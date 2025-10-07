'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  confident: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  analytical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  cautious: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  frustrated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  disappointed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  excited: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  focused: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  nervous: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  optimistic: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  anxious: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
};

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  bullish: 'text-green-600 dark:text-green-400',
  bearish: 'text-red-600 dark:text-red-400',
  sideways: 'text-gray-600 dark:text-gray-400',
  volatile: 'text-orange-600 dark:text-orange-400',
  uncertain: 'text-yellow-600 dark:text-yellow-400',
  neutral: 'text-gray-600 dark:text-gray-400'
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
    open: <Clock className="h-5 w-5 text-blue-500" />,
    closed: <CheckCircle className="h-5 w-5 text-green-500" />,
    cancelled: <XCircle className="h-5 w-5 text-gray-500" />
  };
  return icons[status as keyof typeof icons] || <AlertTriangle className="h-5 w-5 text-yellow-500" />;
});

StatusIcon.displayName = 'StatusIcon';

const PerformanceStars = memo(({ rating }: { rating: number }) => (
  <div className="flex items-center space-x-1">
    {Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ))}
    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
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
      open: <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Open Position</Badge>,
      closed: <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Closed</Badge>,
      cancelled: <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Cancelled</Badge>
    };
    return badges[currentTrade.status as keyof typeof badges] || <Badge variant="secondary">{currentTrade.status}</Badge>;
  }, [currentTrade.status]);

  const sideBadge = useMemo(() => {
    const isBuy = currentTrade.side === 'buy' || currentTrade.side === 'long';
    return (
      <Badge className={
        isBuy 
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      }>
        {currentTrade.side.toUpperCase()} {isBuy ? '📈' : '📉'}
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
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <StatusIcon status={currentTrade.status} />
              <div>
                <CardTitle className="text-3xl font-bold">{currentTrade.symbol}</CardTitle>
                <CardDescription className="text-lg">
                  Trade #{currentTrade.id?.slice(-8).toUpperCase()}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {sideBadge}
              {statusBadge}
              <div className="flex items-center space-x-2">
                <Button onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Trade
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Psychology & Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Psychology Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTrade.mood && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trading Mood:</span>
                <Badge className={MOOD_COLORS[currentTrade.mood as MoodType] || 'bg-gray-100 text-gray-800'}>
                  <Heart className="h-3 w-3 mr-1" />
                  {capitalize(currentTrade.mood)}
                </Badge>
              </div>
            )}
            
            {currentTrade.market_sentiment && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Market Sentiment:</span>
                <Badge variant="outline" className={SENTIMENT_COLORS[currentTrade.market_sentiment as SentimentType] || 'text-gray-600'}>
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {capitalize(currentTrade.market_sentiment)}
                </Badge>
              </div>
            )}
            
            {currentTrade.performance_rating && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Rating:</span>
                <PerformanceStars rating={currentTrade.performance_rating} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* P&L and Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentTrade.profit_loss !== null && currentTrade.status === 'closed' ? (
              <div className="text-center p-6 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <div className={`flex items-center justify-center mb-2 ${
                  currentTrade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentTrade.profit_loss >= 0 ? (
                    <TrendingUp className="h-8 w-8 mr-2" />
                  ) : (
                    <TrendingDown className="h-8 w-8 mr-2" />
                  )}
                </div>
                <p className="text-3xl font-bold mb-2">
                  {CURRENCY_FORMATTER.format(currentTrade.profit_loss)}
                </p>
                {pnlPercentage && (
                  <p className={`text-lg ${
                    currentTrade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentTrade.profit_loss >= 0 ? '+' : ''}{pnlPercentage}%
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center p-6 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  Open Position
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  P&L will be calculated when closed
                </p>
              </div>
            )}

            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Position Value</p>
              <p className="text-xl font-bold">{positionValue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trade Information */}
      <Card>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {formatQuantity(currentTrade.quantity)}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Entry Price</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {formatPrice(currentTrade.entry_price, currentTrade.symbol)}
              </p>
            </div>

            {currentTrade.exit_price && (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Exit Price</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {formatPrice(currentTrade.exit_price, currentTrade.symbol)}
                </p>
              </div>
            )}

            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {duration}
              </p>
            </div>
          </div>

          {/* Risk Management */}
          {(currentTrade.stop_loss || currentTrade.take_profit) && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Risk Management
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentTrade.stop_loss && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <StopCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Stop Loss</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(currentTrade.stop_loss, currentTrade.symbol)}</p>
                        <p className="text-xs text-gray-500">
                          {getPipDistance(currentTrade.entry_price, currentTrade.stop_loss).toFixed(1)} pips
                        </p>
                      </div>
                    </div>
                  )}

                  {currentTrade.take_profit && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Take Profit</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(currentTrade.take_profit, currentTrade.symbol)}</p>
                        <p className="text-xs text-gray-500">
                          {getPipDistance(currentTrade.entry_price, currentTrade.take_profit).toFixed(1)} pips
                        </p>
                      </div>
                    </div>
                  )}

                  {riskReward && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Risk:Reward</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">1:{riskReward}</p>
                        <p className="text-xs text-gray-500">Ratio</p>
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
              <Separator />
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Trading Costs
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {currentTrade.fees && (
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Fees</p>
                      <p className="font-bold">{CURRENCY_FORMATTER.format(currentTrade.fees)}</p>
                    </div>
                  )}
                  {currentTrade.commission && (
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Commission</p>
                      <p className="font-bold">{CURRENCY_FORMATTER.format(currentTrade.commission)}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-600" />
                Pre-Trade Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTrade.pre_trade_plan && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Trading Plan</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.pre_trade_plan}</p>
                  </div>
                </div>
              )}
              
              {currentTrade.trade_analysis && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Technical Analysis</p>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.trade_analysis}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Market Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTrade.market_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Market Notes</p>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.market_notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Psychology & Learning */}
      {(currentTrade.emotional_state || currentTrade.post_trade_review || currentTrade.lessons_learned) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Emotional Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTrade.emotional_state && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Pre-Trade Emotions</p>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.emotional_state}</p>
                  </div>
                </div>
              )}
              
              {currentTrade.post_trade_review && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Post-Trade Reflection</p>
                  <div className="p-3 bg-pink-50 dark:bg-pink-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.post_trade_review}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                Key Learnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTrade.lessons_learned && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Lessons Learned</p>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.lessons_learned}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium">Trade Opened</p>
                <p className="text-sm text-gray-500">{DATETIME_FORMATTER.format(new Date(currentTrade.entry_date))}</p>
              </div>
            </div>
            
            {currentTrade.exit_date && (
              <div className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  currentTrade.status === 'closed' ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium">Trade Closed</p>
                  <p className="text-sm text-gray-500">{DATETIME_FORMATTER.format(new Date(currentTrade.exit_date))}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategy and Notes */}
      {(currentTrade.strategy || currentTrade.setup || currentTrade.notes || (currentTrade.tags && currentTrade.tags.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(currentTrade.strategy || currentTrade.setup) && (
            <Card>
              <CardHeader>
                <CardTitle>Strategy & Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTrade.strategy && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Strategy</p>
                    <p className="text-lg">{currentTrade.strategy}</p>
                  </div>
                )}
                {currentTrade.setup && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Setup</p>
                    <p className="text-lg">{currentTrade.setup}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTrade.tags && currentTrade.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTrade.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {currentTrade.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Notes
                  </p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{currentTrade.notes}</p>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade ({currentTrade.symbol})? 
              This action cannot be undone and will permanently remove all trade data including:
              <br /><br />
              • Trade details and pricing information
              • Notes and strategy information  
              • Tags and setup details
              • All journal entries and psychological data
              • All historical data for this trade
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
    </div>
  );
});