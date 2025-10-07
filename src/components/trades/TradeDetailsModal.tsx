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
      <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] flex flex-col p-0 gap-0 bg-slate-950 border-slate-800">
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-slate-800 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-white tracking-tight">
            {trade.symbol} Trade Details
          </DialogTitle>
          <p className="text-sm text-slate-400 font-normal mt-2">
            View comprehensive details, performance metrics, and journal entries for this trade
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
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