'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTourStore, TourKey } from '@/lib/stores/tourStore';

const TOUR_LABELS: Record<TourKey, string> = {
  dashboard: 'Dashboard',
  trades: 'Trades',
  analytics: 'Analytics',
  login: 'Login',
};

interface TourStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TourStatusDialog({ open, onOpenChange }: TourStatusDialogProps) {
  const { hasSeen, reset } = useTourStore();

  const handleReset = () => {
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tour status</DialogTitle>
          <DialogDescription>See which guided tours this device has already viewed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 py-4">
          {Object.entries(hasSeen).map(([key, seen]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="font-medium">{TOUR_LABELS[key as TourKey]}</span>
              <Badge variant={seen ? 'secondary' : 'default'}>{seen ? 'Seen' : 'New'}</Badge>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={handleReset} className="w-full sm:w-auto">
            Reset tours
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

