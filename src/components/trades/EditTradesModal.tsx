'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TradeService } from '@/lib/services/tradeService';
import { toast } from 'sonner';
import { Trade, TradeFormData } from '@/lib/types/trades';
import { SimpleTradeForm } from '../TradeEntryform/TradeEntryForm';


interface EditTradeModalProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdated?: (updatedTrade: Trade) => void;
}

// Memoized Dialog Header Component
const ModalHeader = memo(({ symbol, status }: { symbol: string; status: string }) => (
  <DialogHeader>
    <DialogTitle>
      Edit Trade - {symbol}
      <span className="ml-2 text-sm font-normal text-gray-500">
        ({status.toUpperCase()})
      </span>
    </DialogTitle>
  </DialogHeader>
));
ModalHeader.displayName = 'ModalHeader';

export const EditTradeModal = memo(({ trade, isOpen, onClose, onTradeUpdated }: EditTradeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Memoize initial data preparation
  const initialData = useMemo((): Partial<Trade> => {
    if (!trade) {
      return {
        user_id: '',
        symbol: '',
        side: 'buy' as const,
        quantity: 0,
        entry_price: 0,
        entry_date: new Date().toISOString().split('T')[0],
        status: 'open' as const,
        fees: 0,
        commission: 0,
        tags: [] as string[],
        mood: 'analytical',
        market_sentiment: 'neutral',
        market_notes: '',
        lessons_learned: '',
        trade_analysis: '',
        emotional_state: '',
        pre_trade_plan: '',
        post_trade_review: '',
        performance_rating: 3
      };
    }

    try {
      return {
        user_id: trade.user_id,
        symbol: trade.symbol || '',
        side: trade.side || 'buy',
        quantity: trade.quantity || 0,
        entry_price: trade.entry_price || 0,
        exit_price: trade.exit_price,
        stop_loss: trade.stop_loss,
        take_profit: trade.take_profit,
        entry_date: trade.entry_date ? trade.entry_date.split('T')[0] : new Date().toISOString().split('T')[0],
        exit_date: trade.exit_date ? trade.exit_date.split('T')[0] : undefined,
        strategy: trade.strategy || '',
        setup: trade.setup || '',
        notes: trade.notes || '',
        fees: trade.fees || 0,
        commission: trade.commission || 0,
        status: trade.status || 'open',
        tags: Array.isArray(trade.tags) ? trade.tags : [],
        // Journal fields
        mood: trade.mood || 'analytical',
        market_sentiment: trade.market_sentiment || 'neutral',
        market_notes: trade.market_notes || '',
        lessons_learned: trade.lessons_learned || '',
        trade_analysis: trade.trade_analysis || '',
        emotional_state: trade.emotional_state || '',
        pre_trade_plan: trade.pre_trade_plan || '',
        post_trade_review: trade.post_trade_review || '',
        performance_rating: trade.performance_rating || 3
      };
    } catch (error) {
      console.error('Error preparing initial data:', error);
      return {
        user_id: trade.user_id || '',
        symbol: trade.symbol || '',
        side: 'buy' as const,
        quantity: 0,
        entry_price: 0,
        entry_date: new Date().toISOString().split('T')[0],
        status: 'open' as const,
        fees: 0,
        commission: 0,
        tags: [] as string[],
        mood: 'analytical',
        market_sentiment: 'neutral',
        market_notes: '',
        lessons_learned: '',
        trade_analysis: '',
        emotional_state: '',
        pre_trade_plan: '',
        post_trade_review: '',
        performance_rating: 3
      };
    }
  }, [trade]);

  // Memoize trade header info
  const headerInfo = useMemo(() => ({
    symbol: trade?.symbol || '',
    status: trade?.status || 'open'
  }), [trade?.symbol, trade?.status]);

  // Memoized submit handler
  const handleSubmit = useCallback(async (tradeData: TradeFormData): Promise<void> => {
    if (!trade.id) {
      console.error('No trade ID found');
      toast.error('Error', {
        description: 'Trade ID is required for updates'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!tradeData.symbol || !tradeData.quantity || !tradeData.entry_price) {
        throw new Error('Missing required fields: symbol, quantity, or entry price');
      }

      // TradeService handles ALL P&L calculations automatically
      const updatedTrade = await TradeService.updateTrade(trade.id, tradeData);

      // Generate success message
      let description = 'Trade and journal entries updated successfully';
      if (updatedTrade.status === 'closed' && updatedTrade.profit_loss !== null && updatedTrade.profit_loss !== undefined) {
        const pnlAmount = updatedTrade.profit_loss;
        description = `Trade updated. ${pnlAmount >= 0 ? 'Profit' : 'Loss'}: $${Math.abs(pnlAmount).toFixed(2)}`;
      }

      toast.success('Trade Updated', {
        description
      });

      onTradeUpdated?.(updatedTrade);
      onClose();

    } catch (error) {
      console.error('Error updating trade:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update trade. Please try again.';
      
      toast.error('Update Failed', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [trade.id, onTradeUpdated, onClose]);

  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Validate trade data
  if (!trade || !trade.id || !trade.user_id) {
    console.error('Invalid trade data provided to EditTradeModal');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalHeader symbol={headerInfo.symbol} status={headerInfo.status} />
        
        <div className="mt-4">
          <SimpleTradeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={initialData}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});
EditTradeModal.displayName = 'EditTradeModal';