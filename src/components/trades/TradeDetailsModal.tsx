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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            Trade Details for {trade.symbol}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
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