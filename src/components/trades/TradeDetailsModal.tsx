'use client';

import { useCallback, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trade } from '@/lib/types/trades';
import { TradeDetailsView } from './TradeViewComponent';

interface TradeDetailsModalProps {
  trade: Trade;
  isOpen: boolean;
  onClose: () => void;
  onTradeUpdated?: (updatedTrade: Trade) => void;
  onTradeDeleted?: () => void;
}

export const TradeDetailsModal = memo(function TradeDetailsModal({
  trade,
  isOpen,
  onClose,
  onTradeUpdated,
  onTradeDeleted
}: TradeDetailsModalProps) {
  const handleTradeDeleted = useCallback(() => {
    onClose();
    onTradeDeleted?.();
  }, [onClose, onTradeDeleted]);

  const handleTradeUpdated = useCallback((updatedTrade: Trade) => {
    onTradeUpdated?.(updatedTrade);
  }, [onTradeUpdated]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {trade.symbol} Trade Details
          </DialogTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
            View comprehensive details, performance metrics, and journal entries for this trade
          </p>
        </DialogHeader>
        
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="p-6">
            <TradeDetailsView
              trade={trade}
              onTradeUpdated={handleTradeUpdated}
              onTradeDeleted={handleTradeDeleted}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});