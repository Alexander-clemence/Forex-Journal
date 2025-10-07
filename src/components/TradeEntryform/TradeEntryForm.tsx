'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useSimpleBalance } from '@/lib/hooks/useAccountBalance';

import { Calculator, Wallet, AlertTriangle, Brain, Target, BarChart3, ArrowLeftRight, Info } from 'lucide-react';
import { Trade, TradeFormData, TradeSide } from '@/lib/types/trades';
import { ProfessionalPipCalculator } from '../lotsizecalculator/LotSizeCalculator';

interface TradeEntryFormProps {
  onSubmit: (trade: TradeFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Trade>;
  isLoading?: boolean;
}

// Extended TradeFormData with status
interface ExtendedTradeFormData extends Omit<TradeFormData, 'status'> {
  status: 'open' | 'closed';
  profit_loss?: number;
}

const moodOptions = [
  { value: 'confident', label: 'Confident', color: 'bg-green-100 text-green-800' },
  { value: 'analytical', label: 'Analytical', color: 'bg-blue-100 text-blue-800' },
  { value: 'cautious', label: 'Cautious', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'frustrated', label: 'Frustrated', color: 'bg-red-100 text-red-800' },
  { value: 'disappointed', label: 'Disappointed', color: 'bg-red-100 text-red-800' },
  { value: 'excited', label: 'Excited', color: 'bg-purple-100 text-purple-800' },
  { value: 'focused', label: 'Focused', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'nervous', label: 'Nervous', color: 'bg-orange-100 text-orange-800' },
  { value: 'optimistic', label: 'Optimistic', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
  { value: 'anxious', label: 'Anxious', color: 'bg-orange-100 text-orange-800' }
];

const marketSentimentOptions = [
  { value: 'bullish', label: 'Bullish' },
  { value: 'bearish', label: 'Bearish' },
  { value: 'sideways', label: 'Sideways' },
  { value: 'volatile', label: 'Volatile' },
  { value: 'uncertain', label: 'Uncertain' },
  { value: 'neutral', label: 'Neutral' }
];

// ============================================================================
// UTILITY FUNCTIONS - Lot Type & P&L Calculations
// ============================================================================

function detectOptimalLotType(units: number): 'micro' | 'mini' | 'standard' {
  if (units < 10000) return 'micro';
  if (units < 100000) return 'mini';
  return 'standard';
}

function getLotMultiplier(type: 'micro' | 'mini' | 'standard'): number {
  switch (type) {
    case 'micro': return 1000;
    case 'mini': return 10000;
    case 'standard': return 100000;
  }
}

function getLotTypeLabel(type: 'micro' | 'mini' | 'standard'): string {
  switch (type) {
    case 'micro': return 'Micro (1,000 units)';
    case 'mini': return 'Mini (10,000 units)';
    case 'standard': return 'Standard (100,000 units)';
  }
}

// FIXED P&L Calculation - Correctly handles LONG and SHORT positions
function calculateTradePnL(
  symbol: string,
  quantity: number,
  entryPrice: number,
  exitPrice: number,
  side: TradeSide,
  fees: number = 0,
  commission: number = 0
): number {
  if (!symbol || !quantity || !entryPrice || !exitPrice) {
    return 0;
  }

  const lotSize = quantity / 100000;
  const isLong = side === 'buy' || side === 'long';
  
  let grossPnL: number;
  
  if (isLong) {
    // Long position: profit when price goes UP
    if (exitPrice > entryPrice) {
      grossPnL = ProfessionalPipCalculator.calculatePotentialProfit(
        symbol, 
        lotSize, 
        entryPrice, 
        exitPrice
      );
    } else {
      grossPnL = -ProfessionalPipCalculator.calculateRiskAmount(
        symbol, 
        lotSize, 
        entryPrice, 
        exitPrice
      );
    }
  } else {
    // Short position: profit when price goes DOWN
    if (exitPrice < entryPrice) {
      grossPnL = ProfessionalPipCalculator.calculatePotentialProfit(
        symbol, 
        lotSize, 
        exitPrice, 
        entryPrice
      );
    } else {
      grossPnL = -ProfessionalPipCalculator.calculateRiskAmount(
        symbol, 
        lotSize, 
        exitPrice, 
        entryPrice
      );
    }
  }

  return grossPnL - fees - commission;
}

// ============================================================================
// SMART LOT SIZE INPUT COMPONENT
// ============================================================================

interface SmartLotSizeInputProps {
  quantity: number;
  onChange: (units: number) => void;
  symbol?: string;
  disabled?: boolean;
}

const SmartLotSizeInput: React.FC<SmartLotSizeInputProps> = ({ 
  quantity, 
  onChange, 
  symbol,
  disabled = false 
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [lotType, setLotType] = useState<'micro' | 'mini' | 'standard'>('standard');
  
  // Initialize display value based on current quantity
  useEffect(() => {
    if (quantity > 0) {
      const optimal = detectOptimalLotType(quantity);
      setLotType(optimal);
      const lots = quantity / getLotMultiplier(optimal);
      setDisplayValue(lots.toFixed(2));
    } else {
      setDisplayValue('');
    }
  }, [quantity]);

  const handleLotChange = (value: string) => {
    setDisplayValue(value);
    const lots = parseFloat(value);
    
    if (!isNaN(lots) && lots >= 0) {
      const units = lots * getLotMultiplier(lotType);
      onChange(units);
    } else if (value === '' || value === '0') {
      onChange(0);
    }
  };

  const handleTypeChange = (newType: 'micro' | 'mini' | 'standard') => {
    // Keep the same units, just change how we display it
    const currentUnits = parseFloat(displayValue || '0') * getLotMultiplier(lotType);
    setLotType(newType);
    const newDisplayLots = currentUnits / getLotMultiplier(newType);
    setDisplayValue(newDisplayLots > 0 ? newDisplayLots.toFixed(2) : '');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="lotSize" className="text-xs font-semibold">
            Position Size
          </Label>
          <Input
            id="lotSize"
            type="number"
            step="0.01"
            min="0"
            value={displayValue}
            onChange={(e) => handleLotChange(e.target.value)}
            placeholder="0.01"
            className="h-10 font-semibold"
            disabled={disabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Lot Type</Label>
          <Select value={lotType} onValueChange={handleTypeChange} disabled={disabled}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="micro">Micro</SelectItem>
              <SelectItem value="mini">Mini</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Total units display */}
      <div className="p-2 bg-white dark:bg-gray-800 border rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Total Units:</span>
          <span className="font-semibold text-sm">{quantity.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Quick conversion reference */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-1 mb-1">
          <Info className="h-3 w-3 text-blue-600" />
          <span className="font-medium text-blue-700 dark:text-blue-300">All Formats:</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-gray-700 dark:text-gray-300">
          <div className="text-center">
            <div className="font-medium">{(quantity / 1000).toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">Micro</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{(quantity / 10000).toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">Mini</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{(quantity / 100000).toFixed(2)}</div>
            <div className="text-[10px] text-gray-500">Standard</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN TRADE ENTRY FORM COMPONENT
// ============================================================================

export function TradeEntryForm({ onSubmit, onCancel, initialData, isLoading = false }: TradeEntryFormProps) {
  const { currentBalance } = useSimpleBalance();
  const router = useRouter();
  const [showLotCalculator, setShowLotCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState('trade-details');
  
  const [calcMode, setCalcMode] = useState<'manual' | 'risk'>('manual');
  const [riskPercentInput, setRiskPercentInput] = useState('2');
  
  const transformedInitialData = useMemo(() => initialData ? { 
    ...initialData, 
    status: (initialData as any).status || 'open',
    exit_price: initialData.exit_price ?? undefined, 
    stop_loss: initialData.stop_loss ?? undefined, 
    take_profit: initialData.take_profit ?? undefined, 
    exit_date: initialData.exit_date ?? undefined, 
    fees: initialData.fees ?? undefined, 
    commission: initialData.commission ?? undefined 
  } : {}, [initialData]);

  const [formData, setFormData] = useState<ExtendedTradeFormData>({ 
    symbol: '', 
    side: 'buy',
    status: 'open',
    quantity: 0, 
    entry_price: 0, 
    exit_price: undefined, 
    stop_loss: undefined, 
    take_profit: undefined, 
    entry_date: new Date().toISOString().split('T')[0], 
    exit_date: undefined, 
    strategy: '', 
    setup: '', 
    notes: '', 
    fees: 0, 
    commission: 0, 
    tags: [], 
    mood: 'analytical', 
    market_sentiment: 'neutral', 
    market_notes: '', 
    lessons_learned: '', 
    trade_analysis: '', 
    emotional_state: '', 
    pre_trade_plan: '', 
    post_trade_review: '', 
    performance_rating: 3, 
    ...transformedInitialData 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // CONSOLIDATED Risk Metrics Calculation (Single Source of Truth)
  const riskMetrics = useMemo(() => {
    if (!formData.symbol || !formData.entry_price || !currentBalance) {
      return null;
    }

    const lotSize = formData.quantity / 100000;
    const pipValue = ProfessionalPipCalculator.calculatePipValue(formData.symbol);
    const pipSize = ProfessionalPipCalculator.getPipSize(formData.symbol);
    
    const metrics = {
      pipValue,
      lotSize,
      riskAmount: 0,
      riskPercentage: 0,
      riskPips: 0,
      potentialProfit: 0,
      profitPercentage: 0,
      rewardPips: 0,
      riskRewardRatio: 0,
      suggestedLotSize: 0,
    };

    // Calculate risk if stop loss is set
    if (formData.stop_loss && formData.quantity > 0) {
      metrics.riskAmount = ProfessionalPipCalculator.calculateRiskAmount(
        formData.symbol, 
        lotSize, 
        formData.entry_price, 
        formData.stop_loss
      );
      metrics.riskPercentage = (metrics.riskAmount / currentBalance) * 100;
      metrics.riskPips = Math.abs(formData.entry_price - formData.stop_loss) / pipSize;
      
      // Calculate suggested lot size based on risk percentage
      const targetRiskPercent = parseFloat(riskPercentInput) || 2;
      metrics.suggestedLotSize = ProfessionalPipCalculator.calculateSuggestedLotSize(
        formData.symbol,
        formData.entry_price,
        formData.stop_loss,
        currentBalance,
        targetRiskPercent
      );
    }
    
    // Calculate profit if take profit is set
    if (formData.take_profit && formData.quantity > 0) {
      metrics.potentialProfit = ProfessionalPipCalculator.calculatePotentialProfit(
        formData.symbol, 
        lotSize, 
        formData.entry_price, 
        formData.take_profit
      );
      metrics.profitPercentage = (metrics.potentialProfit / currentBalance) * 100;
      metrics.rewardPips = Math.abs(formData.take_profit - formData.entry_price) / pipSize;
    }

    // Calculate R:R ratio
    if (metrics.riskAmount > 0 && metrics.potentialProfit > 0) {
      metrics.riskRewardRatio = metrics.potentialProfit / metrics.riskAmount;
    }

    return metrics;
  }, [
    formData.symbol, 
    formData.quantity, 
    formData.entry_price, 
    formData.stop_loss, 
    formData.take_profit, 
    currentBalance, 
    riskPercentInput
  ]);

  const riskLevel = useMemo(() => {
    if (!riskMetrics || !riskMetrics.riskAmount) return null;
    
    const risk = riskMetrics.riskPercentage;
    if (risk > 10) return { level: 'Very High', color: 'text-red-700 bg-red-100 border-red-300' };
    if (risk > 5) return { level: 'High', color: 'text-red-600 bg-red-50 border-red-200' };
    if (risk > 2) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { level: 'Low', color: 'text-green-600 bg-green-50 border-green-200' };
  }, [riskMetrics]);

  // Calculate actual P&L for closed trades
  const actualPnL = useMemo(() => {
    if (formData.status === 'closed' && formData.exit_price && formData.entry_price && formData.symbol && formData.quantity) {
      return calculateTradePnL(
        formData.symbol,
        formData.quantity,
        formData.entry_price,
        formData.exit_price,
        formData.side,
        formData.fees || 0,
        formData.commission || 0
      );
    }
    return null;
  }, [formData.status, formData.symbol, formData.quantity, formData.entry_price, formData.exit_price, formData.side, formData.fees, formData.commission]);

  // ENHANCED Form Validation with SL/TP Direction Check
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Basic validations
    if (!formData.symbol?.trim()) newErrors.symbol = 'Symbol is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.entry_price || formData.entry_price <= 0) newErrors.entry_price = 'Entry price must be greater than 0';
    if (!formData.entry_date) newErrors.entry_date = 'Entry date is required';
    
    // NEW: Validate SL/TP direction
    const isLong = formData.side === 'buy' || formData.side === 'long';
    
    if (formData.stop_loss) {
      if (isLong && formData.stop_loss >= formData.entry_price) {
        newErrors.stop_loss = 'Stop Loss must be BELOW entry price for LONG positions';
      }
      if (!isLong && formData.stop_loss <= formData.entry_price) {
        newErrors.stop_loss = 'Stop Loss must be ABOVE entry price for SHORT positions';
      }
    }
    
    if (formData.take_profit) {
      if (isLong && formData.take_profit <= formData.entry_price) {
        newErrors.take_profit = 'Take Profit must be ABOVE entry price for LONG positions';
      }
      if (!isLong && formData.take_profit >= formData.entry_price) {
        newErrors.take_profit = 'Take Profit must be BELOW entry price for SHORT positions';
      }
    }
    
    // Risk validation
    if (riskMetrics && riskMetrics.riskPercentage > 10) {
      newErrors.risk = 'Warning: Risk exceeds 10% of account balance';
    }
    
    // Closed trade validation
    if (formData.status === 'closed') {
      if (!formData.exit_price || formData.exit_price <= 0) {
        newErrors.exit_price = 'Exit price required for closed trades';
      }
      if (!formData.exit_date) {
        newErrors.exit_date = 'Exit date required for closed trades';
      }
      if (formData.exit_date && formData.entry_date && formData.exit_date < formData.entry_date) {
        newErrors.exit_date = 'Exit date cannot be before entry date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, riskMetrics]);

  // FIXED Form Submission with proper async handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors below'
      });
      return;
    }
    
    // High risk confirmation
    if (riskMetrics && riskMetrics.riskPercentage > 5) {
      const confirmed = window.confirm(
        `⚠️ HIGH RISK WARNING\n\nThis trade risks ${riskMetrics.riskPercentage.toFixed(2)}% of your account balance.\n\nAre you sure you want to proceed?`
      );
      if (!confirmed) return;
    }
    
    try {
      const submissionData: any = { ...formData };
      
      // Calculate P&L for closed trades
      if (formData.status === 'closed' && formData.exit_price) {
        const pnl = calculateTradePnL(
          formData.symbol,
          formData.quantity,
          formData.entry_price,
          formData.exit_price,
          formData.side,
          formData.fees || 0,
          formData.commission || 0
        );
        
        submissionData.profit_loss = pnl;
      }
      
      // Wait for submission to complete
      await onSubmit(submissionData);
      
      // Show success toast
      toast.success('Trade Saved', {
        description: 'Your trade has been recorded successfully'
      });
      
      // Navigate after short delay to ensure toast is visible
      setTimeout(() => {
        router.push('/dashboard/trades');
      }, 500);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to save trade. Please try again.'
      });
    }
  }, [formData, validateForm, onSubmit, router, riskMetrics]);

  const handleInputChange = useCallback((field: keyof ExtendedTradeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const handleCancel = useCallback(() => { 
    onCancel ? onCancel() : router.back(); 
  }, [onCancel, router]);

  const handleUseSuggested = useCallback(() => {
    if (riskMetrics && riskMetrics.suggestedLotSize > 0) {
      const suggestedUnits = riskMetrics.suggestedLotSize * 100000;
      handleInputChange('quantity', suggestedUnits);
      toast.success('Position Updated', {
        description: `Position set to ${(suggestedUnits / 100000).toFixed(2)} standard lots (${suggestedUnits.toFixed(0)} units)`
      });
    }
  }, [riskMetrics, handleInputChange]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Risk Display Card */}
      {currentBalance && riskMetrics && riskMetrics.riskAmount > 0 && riskLevel && (
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Balance: ${currentBalance.toLocaleString()}</span>
              </div>
              <span className="text-sm text-gray-600">{riskMetrics.lotSize.toFixed(2)} lots</span>
            </div>
            <div className={`p-3 rounded border ${riskLevel.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Risk: {riskLevel.level}</span>
                </div>
                <span className="font-bold">{riskMetrics.riskPercentage.toFixed(2)}%</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Risk Amount:</span>
                  <p className="font-semibold text-red-600">${riskMetrics.riskAmount.toFixed(2)}</p>
                </div>
                {riskMetrics.potentialProfit > 0 && (
                  <div>
                    <span className="text-gray-600">Potential Profit:</span>
                    <p className="font-semibold text-green-600">${riskMetrics.potentialProfit.toFixed(2)}</p>
                  </div>
                )}
                {riskMetrics.riskRewardRatio > 0 && (
                  <div>
                    <span className="text-gray-600">R:R Ratio:</span>
                    <p className="font-semibold">1:{riskMetrics.riskRewardRatio.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
            {errors.risk && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {errors.risk}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Trade' : 'New Trade Entry'} with Journal</CardTitle>
          <CardDescription>Complete trade entry with psychology tracking and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trade-details">Trade Details</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="psychology">Psychology</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="trade-details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Instrument *</Label>
                    <Input 
                      id="symbol" 
                      value={formData.symbol} 
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())} 
                      placeholder="EURUSD, XAUUSD, BTCUSD..." 
                      className={errors.symbol ? 'border-red-500' : ''} 
                    />
                    {errors.symbol && <p className="text-sm text-red-500">{errors.symbol}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Trade Status *</Label>
                    <Select value={formData.status} onValueChange={(value: 'open' | 'closed') => handleInputChange('status', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="side">Direction *</Label>
                    <Select value={formData.side} onValueChange={(value: TradeSide) => handleInputChange('side', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy / Long</SelectItem>
                        <SelectItem value="sell">Sell / Short</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry_date">Entry Date *</Label>
                    <Input 
                      id="entry_date" 
                      type="date" 
                      value={formData.entry_date} 
                      onChange={(e) => handleInputChange('entry_date', e.target.value)} 
                      className={errors.entry_date ? 'border-red-500' : ''} 
                    />
                    {errors.entry_date && <p className="text-sm text-red-500">{errors.entry_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="entry_price">Entry Price *</Label>
                    </div>
                    <Input 
                      id="entry_price" 
                      type="number" 
                      step="0.00001" 
                      value={formData.entry_price || ''} 
                      onChange={(e) => handleInputChange('entry_price', parseFloat(e.target.value) || 0)} 
                      placeholder="1.12345" 
                      className={errors.entry_price ? 'border-red-500' : ''} 
                    />
                    {errors.entry_price && <p className="text-sm text-red-500">{errors.entry_price}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stop_loss">Stop Loss</Label>
                    <Input 
                      id="stop_loss" 
                      type="number" 
                      step="0.00001" 
                      value={formData.stop_loss || ''} 
                      onChange={(e) => handleInputChange('stop_loss', parseFloat(e.target.value) || undefined)} 
                      placeholder="1.12000" 
                      className={errors.stop_loss ? 'border-red-500' : ''} 
                    />
                    {errors.stop_loss && <p className="text-sm text-red-500">{errors.stop_loss}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="take_profit">Take Profit</Label>
                    <Input 
                      id="take_profit" 
                      type="number" 
                      step="0.00001" 
                      value={formData.take_profit || ''} 
                      onChange={(e) => handleInputChange('take_profit', parseFloat(e.target.value) || undefined)} 
                      placeholder="1.13000" 
                      className={errors.take_profit ? 'border-red-500' : ''} 
                    />
                    {errors.take_profit && <p className="text-sm text-red-500">{errors.take_profit}</p>}
                  </div>
                </div>

                {/* Smart Lot Size Calculator */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">Position Size *</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowLotCalculator(!showLotCalculator)} 
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={showLotCalculator ? 'Hide position calculator' : 'Show position calculator'}
                      aria-expanded={showLotCalculator}
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      {showLotCalculator ? 'Hide' : 'Show'} Calculator
                    </Button>
                  </div>

                  {!showLotCalculator ? (
                    <div className="space-y-2">
                      <SmartLotSizeInput
                        quantity={formData.quantity}
                        onChange={(units) => handleInputChange('quantity', units)}
                        symbol={formData.symbol}
                      />
                      {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Calculator className="h-4 w-4" />
                            Advanced Position Calculator
                          </CardTitle>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCalcMode(prev => prev === 'manual' ? 'risk' : 'manual')} 
                            className="gap-2"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            {calcMode === 'manual' ? 'Switch to Risk %' : 'Switch to Manual'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!formData.symbol || !formData.entry_price ? (
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600">Enter symbol and entry price to use calculator</p>
                          </div>
                        ) : calcMode === 'manual' ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <Label className="text-sm font-medium mb-3 block">Manual Position Entry</Label>
                              
                              <SmartLotSizeInput
                                quantity={formData.quantity}
                                onChange={(units) => handleInputChange('quantity', units)}
                                symbol={formData.symbol}
                              />

                              {errors.quantity && (
                                <p className="text-sm text-red-500 mt-2">{errors.quantity}</p>
                              )}

                              {formData.stop_loss && riskMetrics && (
                                <div className="space-y-2 mt-4">
                                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Risk Analysis</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <span className="text-xs text-gray-500">Risk Amount:</span>
                                        <p className="font-bold text-red-600">${riskMetrics.riskAmount.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">Risk %:</span>
                                        <p className={`font-bold ${riskMetrics.riskPercentage > 5 ? 'text-red-600' : riskMetrics.riskPercentage > 2 ? 'text-orange-600' : 'text-green-600'}`}>
                                          {riskMetrics.riskPercentage.toFixed(2)}%
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">Pips at Risk:</span>
                                        <p className="font-semibold">{riskMetrics.riskPips.toFixed(1)}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">Pip Value:</span>
                                        <p className="font-semibold">${riskMetrics.pipValue.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {formData.take_profit && riskMetrics && riskMetrics.potentialProfit > 0 && (
                                <div className="space-y-2 mt-4">
                                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                    <h4 className="text-xs font-semibold text-gray-600 mb-2">Profit Potential</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <span className="text-xs text-gray-500">Profit Amount:</span>
                                        <p className="font-bold text-green-600">${riskMetrics.potentialProfit.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">Profit %:</span>
                                        <p className="font-bold text-green-600">{riskMetrics.profitPercentage.toFixed(2)}%</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">Target Pips:</span>
                                        <p className="font-semibold">{riskMetrics.rewardPips.toFixed(1)}</p>
                                      </div>
                                      {formData.stop_loss && (
                                        <div>
                                          <span className="text-xs text-gray-500">Risk:Reward:</span>
                                          <p className="font-bold text-blue-600">1:{riskMetrics.riskRewardRatio.toFixed(2)}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {riskMetrics && riskMetrics.riskPercentage > 5 && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mt-4">
                                  <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <strong>High Risk Warning:</strong> Position exceeds 5% account risk
                                  </p>
                                </div>
                              )}

                              {formData.stop_loss && formData.take_profit && riskMetrics && riskMetrics.riskRewardRatio < 1 && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-4">
                                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Risk:Reward ratio is less than 1:1 - consider adjusting targets
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <Label className="text-sm font-medium mb-3 block">Calculate Position from Risk %</Label>
                            
                            {!formData.stop_loss ? (
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded mb-3">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  Please enter a Stop Loss price to calculate suggested position size
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="space-y-2">
                                    <Label htmlFor="riskPercent" className="text-xs">Target Risk %</Label>
                                    <Input 
                                      id="riskPercent" 
                                      type="number" 
                                      step="0.1" 
                                      min="0.1"
                                      max="10"
                                      value={riskPercentInput} 
                                      onChange={(e) => setRiskPercentInput(e.target.value)} 
                                      className="h-9" 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Suggested Lots</Label>
                                    <div className="h-9 flex items-center px-3 bg-white dark:bg-gray-800 border rounded-md">
                                      <span className="font-semibold">
                                        {riskMetrics ? (riskMetrics.suggestedLotSize / 100000).toFixed(2) : '0.00'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {riskMetrics && (
                                  <>
                                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                      <div>
                                        <span className="text-gray-600">Suggested Units:</span>
                                        <p className="font-semibold">{(riskMetrics.suggestedLotSize * 100000).toFixed(0)}</p>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Risk Amount:</span>
                                        <p className="font-semibold text-red-600">${(currentBalance! * (parseFloat(riskPercentInput) || 0) / 100).toFixed(2)}</p>
                                      </div>
                                    </div>
                                    <Button 
                                      type="button" 
                                      onClick={handleUseSuggested} 
                                      className="w-full" 
                                      size="sm"
                                      disabled={!riskMetrics.suggestedLotSize || riskMetrics.suggestedLotSize <= 0}
                                    >
                                      Apply Suggested Position
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {formData.status === 'closed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="exit_price">Exit Price *</Label>
                      <Input 
                        id="exit_price" 
                        type="number" 
                        step="0.00001" 
                        value={formData.exit_price || ''} 
                        onChange={(e) => handleInputChange('exit_price', parseFloat(e.target.value) || undefined)} 
                        placeholder="1.12800" 
                        className={errors.exit_price ? 'border-red-500' : ''} 
                      />
                      {errors.exit_price && <p className="text-sm text-red-500">{errors.exit_price}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exit_date">Exit Date *</Label>
                      <Input 
                        id="exit_date" 
                        type="date" 
                        value={formData.exit_date || ''} 
                        onChange={(e) => handleInputChange('exit_date', e.target.value)} 
                        className={errors.exit_date ? 'border-red-500' : ''} 
                      />
                      {errors.exit_date && <p className="text-sm text-red-500">{errors.exit_date}</p>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="strategy">Strategy</Label>
                    <Input 
                      id="strategy" 
                      value={formData.strategy || ''} 
                      onChange={(e) => handleInputChange('strategy', e.target.value)} 
                      placeholder="Breakout, Support/Resistance..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees">Fees</Label>
                    <Input 
                      id="fees" 
                      type="number" 
                      step="0.01" 
                      value={formData.fees || ''} 
                      onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)} 
                      placeholder="0.00" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission</Label>
                    <Input 
                      id="commission" 
                      type="number" 
                      step="0.01" 
                      value={formData.commission || ''} 
                      onChange={(e) => handleInputChange('commission', parseFloat(e.target.value) || 0)} 
                      placeholder="0.00" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input 
                    id="tags" 
                    value={formData.tags?.join(', ') || ''} 
                    onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))} 
                    placeholder="scalp, news, breakout, trending" 
                  />
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Trade Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="market_sentiment">Market Sentiment</Label>
                    <Select value={formData.market_sentiment || 'neutral'} onValueChange={(value) => handleInputChange('market_sentiment', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {marketSentimentOptions.map(sentiment => (
                          <SelectItem key={sentiment.value} value={sentiment.value}>{sentiment.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="performance_rating">Performance Rating (1-5)</Label>
                    <Select value={formData.performance_rating?.toString()} onValueChange={(value) => handleInputChange('performance_rating', parseInt(value))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Low Confidence</SelectItem>
                        <SelectItem value="2">2 - Below Average</SelectItem>
                        <SelectItem value="3">3 - Average</SelectItem>
                        <SelectItem value="4">4 - High Confidence</SelectItem>
                        <SelectItem value="5">5 - Excellent Setup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pre_trade_plan">Pre-Trade Plan</Label>
                    <Textarea 
                      id="pre_trade_plan" 
                      value={formData.pre_trade_plan || ''} 
                      onChange={(e) => handleInputChange('pre_trade_plan', e.target.value)} 
                      placeholder="What's your plan for this trade? Entry criteria, risk management, targets..." 
                      rows={3} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trade_analysis">Technical Analysis</Label>
                    <Textarea 
                      id="trade_analysis" 
                      value={formData.trade_analysis || ''} 
                      onChange={(e) => handleInputChange('trade_analysis', e.target.value)} 
                      placeholder="Technical setup, chart patterns, indicators, support/resistance levels..." 
                      rows={4} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="market_notes">Market Context</Label>
                    <Textarea 
                      id="market_notes" 
                      value={formData.market_notes || ''} 
                      onChange={(e) => handleInputChange('market_notes', e.target.value)} 
                      placeholder="Economic events, market conditions, news affecting this trade..." 
                      rows={3} 
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="psychology" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Trading Psychology</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mood">Current Mood</Label>
                    <Select value={formData.mood || 'analytical'} onValueChange={(value) => handleInputChange('mood', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {moodOptions.map(mood => (
                          <SelectItem key={mood.value} value={mood.value}>{mood.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.mood && (
                      <div className="mt-2">
                        {moodOptions.map(mood => formData.mood === mood.value && (
                          <Badge key={mood.value} className={mood.color}>{mood.label}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emotional_state">Emotional State & Mindset</Label>
                    <Textarea 
                      id="emotional_state" 
                      value={formData.emotional_state || ''} 
                      onChange={(e) => handleInputChange('emotional_state', e.target.value)} 
                      placeholder="How are you feeling about this trade? Any stress, excitement, or external factors affecting your mindset?" 
                      rows={3} 
                    />
                  </div>
                  {formData.status === 'closed' && (
                    <div className="space-y-2">
                      <Label htmlFor="post_trade_review">Post-Trade Review</Label>
                      <Textarea 
                        id="post_trade_review" 
                        value={formData.post_trade_review || ''} 
                        onChange={(e) => handleInputChange('post_trade_review', e.target.value)} 
                        placeholder="How did you feel during the trade? Did emotions affect your decisions?" 
                        rows={3} 
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Review & Learning</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Trade Notes</Label>
                    <Textarea 
                      id="notes" 
                      value={formData.notes || ''} 
                      onChange={(e) => handleInputChange('notes', e.target.value)} 
                      placeholder="Additional notes, observations, execution details..." 
                      rows={4} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessons_learned">Key Lessons</Label>
                    <Textarea 
                      id="lessons_learned" 
                      value={formData.lessons_learned || ''} 
                      onChange={(e) => handleInputChange('lessons_learned', e.target.value)} 
                      placeholder="What did you learn from this trade? What will you do differently next time?" 
                      rows={4} 
                    />
                  </div>
                  {formData.status === 'closed' && formData.exit_price && formData.entry_price && actualPnL !== null && (
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                      <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Trade Outcome Preview
                      </Label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Entry Price:</span>
                            <p className="font-semibold">{formData.entry_price.toFixed(5)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Exit Price:</span>
                            <p className="font-semibold">{formData.exit_price.toFixed(5)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Direction:</span>
                            <p className="font-semibold">{formData.side === 'buy' || formData.side === 'long' ? 'LONG' : 'SHORT'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Position Size:</span>
                            <p className="font-semibold">{(formData.quantity / 100000).toFixed(2)} lots</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                          <span className="text-sm text-gray-600">Calculated Profit/Loss:</span>
                          <p className={`font-bold text-2xl ${actualPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {actualPnL >= 0 ? '+' : ''}${actualPnL.toFixed(2)}
                          </p>
                        </div>
                        {(formData.fees! > 0 || formData.commission! > 0) && (
                          <p className="text-xs text-gray-500">
                            (Includes fees: ${formData.fees!.toFixed(2)} & commission: ${formData.commission!.toFixed(2)})
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className={riskMetrics && riskMetrics.riskPercentage > 10 ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {isLoading ? 'Saving...' : (initialData ? 'Update Trade' : 'Save Trade')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}