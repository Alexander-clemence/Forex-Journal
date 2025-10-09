'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trade, TradeFormData, TradeSide } from '@/lib/types/trades';

interface SimpleTradeFormProps {
  onSubmit: (trade: TradeFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Trade>;
  isLoading?: boolean;
}

export function SimpleTradeForm({ onSubmit, onCancel, initialData, isLoading = false }: SimpleTradeFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('trade');
  
  const [formData, setFormData] = useState<any>({ 
    symbol: initialData?.symbol || '', 
    side: initialData?.side || 'buy',
    status: (initialData as any)?.status || 'open',
    quantity: initialData?.quantity || 0, 
    entry_price: initialData?.entry_price || 0, 
    exit_price: initialData?.exit_price, 
    stop_loss: initialData?.stop_loss, 
    take_profit: initialData?.take_profit, 
    entry_date: initialData?.entry_date || new Date().toISOString().split('T')[0], 
    exit_date: initialData?.exit_date,
    profit_loss: (initialData as any)?.profit_loss || undefined,
    strategy: initialData?.strategy || '', 
    notes: initialData?.notes || '', 
    fees: initialData?.fees || 0, 
    commission: initialData?.commission || 0, 
    tags: initialData?.tags || [], 
    mood: initialData?.mood || 'neutral', 
    market_sentiment: initialData?.market_sentiment || 'neutral', 
    lessons_learned: initialData?.lessons_learned || '', 
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.symbol?.trim()) newErrors.symbol = 'Symbol required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Lot size required';
    if (!formData.entry_price || formData.entry_price <= 0) newErrors.entry_price = 'Entry price required';
    if (!formData.entry_date) newErrors.entry_date = 'Entry date required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      await onSubmit(formData);
      toast.success('Trade saved successfully');
      router.push('/dashboard/trades');
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error('Failed to save trade');
    }
  }, [formData, validateForm, onSubmit, router]);

  const handleInputChange = useCallback((field: keyof TradeFormData, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const handleCancel = useCallback(() => { 
    onCancel ? onCancel() : router.back(); 
  }, [onCancel, router]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Trade' : 'New Trade'}</CardTitle>
          <CardDescription>Simple trade journal entry</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trade">Trade Details</TabsTrigger>
                <TabsTrigger value="journal">Journal</TabsTrigger>
              </TabsList>

              <TabsContent value="trade" className="space-y-4 mt-4">
                {/* Basic Trade Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input 
                      id="symbol" 
                      value={formData.symbol} 
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())} 
                      placeholder="XAUUSD" 
                      className={errors.symbol ? 'border-red-500' : ''} 
                    />
                    {errors.symbol && <p className="text-xs text-red-500">{errors.symbol}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="side">Direction *</Label>
                    <Select value={formData.side} onValueChange={(value: TradeSide) => handleInputChange('side', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy / Long</SelectItem>
                        <SelectItem value="sell">Sell / Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    {/* @ts-ignore */}
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Lot Size *</Label>
                    <Input 
                      id="quantity" 
                      type="text"
                      inputMode="decimal"
                      value={formData.quantity || ''} 
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty or valid decimal with max 2 decimal places
                        if (value === '') {
                          setFormData((prev: any) => ({ ...prev, quantity: '' }));
                        } else if (/^\d*\.?\d{0,2}$/.test(value)) {
                          // Valid number format with max 2 decimals
                          setFormData((prev: any) => ({ ...prev, quantity: value }));
                        }
                      }}
                      onBlur={(e) => {
                        // Convert to number on blur and format to 2 decimals
                        const parsed = parseFloat(e.target.value);
                        if (!isNaN(parsed) && parsed > 0) {
                          const formatted = parseFloat(parsed.toFixed(2));
                          handleInputChange('quantity', formatted);
                        } else {
                          handleInputChange('quantity', 0);
                        }
                      }}
                      placeholder="0.01" 
                      className={errors.quantity ? 'border-red-500' : ''} 
                    />
                    {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
                    <p className="text-xs text-gray-500">Max 2 decimal places (e.g., 0.01, 0.15, 1.50)</p>
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry_price">Entry Price *</Label>
                    <Input 
                      id="entry_price" 
                      type="number" 
                      step="0.00001" 
                      value={formData.entry_price || ''} 
                      onChange={(e) => handleInputChange('entry_price', parseFloat(e.target.value) || 0)} 
                      placeholder="2650.00" 
                      className={errors.entry_price ? 'border-red-500' : ''} 
                    />
                    {errors.entry_price && <p className="text-xs text-red-500">{errors.entry_price}</p>}
                  </div>

                  {formData.status === 'closed' && (
                    <div className="space-y-2">
                      <Label htmlFor="exit_price">Exit Price *</Label>
                      <Input 
                        id="exit_price" 
                        type="number" 
                        step="0.00001" 
                        value={formData.exit_price || ''} 
                        onChange={(e) => handleInputChange('exit_price', parseFloat(e.target.value) || undefined)} 
                        placeholder="2660.00" 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="stop_loss">Stop Loss</Label>
                    <Input 
                      id="stop_loss" 
                      type="number" 
                      step="0.00001" 
                      value={formData.stop_loss || ''} 
                      onChange={(e) => handleInputChange('stop_loss', parseFloat(e.target.value) || undefined)} 
                      placeholder="2640.00" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="take_profit">Take Profit</Label>
                    <Input 
                      id="take_profit" 
                      type="number" 
                      step="0.00001" 
                      value={formData.take_profit || ''} 
                      onChange={(e) => handleInputChange('take_profit', parseFloat(e.target.value) || undefined)} 
                      placeholder="2670.00" 
                    />
                  </div>
                </div>

                {/* Dates and P&L */}
                <div className={`grid grid-cols-1 gap-4 ${formData.status === 'closed' ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
                  <div className="space-y-2">
                    <Label htmlFor="entry_date">Entry Date *</Label>
                    <Input 
                      id="entry_date" 
                      type="date" 
                      value={formData.entry_date} 
                      onChange={(e) => handleInputChange('entry_date', e.target.value)} 
                      className={errors.entry_date ? 'border-red-500' : ''} 
                    />
                    {errors.entry_date && <p className="text-xs text-red-500">{errors.entry_date}</p>}
                  </div>

                  {formData.status === 'closed' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="exit_date">Exit Date *</Label>
                        <Input 
                          id="exit_date" 
                          type="date" 
                          value={formData.exit_date || ''} 
                          onChange={(e) => handleInputChange('exit_date', e.target.value || undefined)} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profit_loss">Profit/Loss ($) *</Label>
                        <Input 
                          id="profit_loss" 
                          type="number" 
                          step="0.01" 
                          value={formData.profit_loss !== undefined ? formData.profit_loss : ''} 
                          //@ts-ignore
                          onChange={(e) => handleInputChange('profit_loss', e.target.value ? parseFloat(e.target.value) : undefined)} 
                          placeholder="100.00 or -50.00" 
                        />
                        <p className="text-xs text-gray-500">Enter actual P&L from broker</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="strategy">Strategy</Label>
                    <Input 
                      id="strategy" 
                      value={formData.strategy || ''} 
                      onChange={(e) => handleInputChange('strategy', e.target.value)} 
                      placeholder="Breakout, Trend..." 
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

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input 
                    id="tags" 
                    value={formData.tags?.join(', ') || ''} 
                    onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))} 
                    placeholder="scalp, breakout, trend" 
                  />
                  <p className="text-xs text-gray-500">Comma separated</p>
                </div>
              </TabsContent>

              <TabsContent value="journal" className="space-y-4 mt-4">
                {/* Psychology */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mood">Mood</Label>
                    <Select value={formData.mood || 'neutral'} onValueChange={(value) => handleInputChange('mood', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="analytical">Analytical</SelectItem>
                        <SelectItem value="cautious">Cautious</SelectItem>
                        <SelectItem value="frustrated">Frustrated</SelectItem>
                        <SelectItem value="excited">Excited</SelectItem>
                        <SelectItem value="focused">Focused</SelectItem>
                        <SelectItem value="nervous">Nervous</SelectItem>
                        <SelectItem value="optimistic">Optimistic</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="anxious">Anxious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="market_sentiment">Market Sentiment</Label>
                    <Select value={formData.market_sentiment || 'neutral'} onValueChange={(value) => handleInputChange('market_sentiment', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bullish">Bullish</SelectItem>
                        <SelectItem value="bearish">Bearish</SelectItem>
                        <SelectItem value="sideways">Sideways</SelectItem>
                        <SelectItem value="volatile">Volatile</SelectItem>
                        <SelectItem value="uncertain">Uncertain</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Trade Notes</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes || ''} 
                    onChange={(e) => handleInputChange('notes', e.target.value)} 
                    placeholder="What was your reasoning? Market conditions? Setup details..." 
                    rows={4} 
                  />
                </div>

                {/* Lessons */}
                <div className="space-y-2">
                  <Label htmlFor="lessons_learned">Lessons Learned</Label>
                  <Textarea 
                    id="lessons_learned" 
                    value={formData.lessons_learned || ''} 
                    onChange={(e) => handleInputChange('lessons_learned', e.target.value)} 
                    placeholder="What did you learn? What will you do differently?" 
                    rows={3} 
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Save Trade')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}