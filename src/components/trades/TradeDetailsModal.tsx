// TradeDetailsModal.tsx
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
      <DialogContent className="w-[98vw] max-w-[1800px] h-[95vh] flex flex-col p-0 gap-0 bg-slate-950 border-slate-800">
        <DialogHeader className="px-10 pt-8 pb-6 border-b border-slate-800/50 flex-shrink-0">
          <DialogTitle className="text-3xl font-bold text-white tracking-tight">
            {trade.symbol} Trade Details
          </DialogTitle>
          <p className="text-sm text-slate-400 font-normal mt-2">
            View comprehensive details, performance metrics, and journal entries for this trade
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0 px-10 py-8">
          <TradeDetailsView
            trade={trade}
            onTradeUpdated={handleTradeUpdated}
            onTradeDeleted={handleTradeDeleted}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});