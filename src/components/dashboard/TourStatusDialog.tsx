'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGuideDialogStore } from '@/lib/stores/guideDialogStore';
import { GUIDE_DIALOG_STORAGE_KEY } from '@/components/dashboard/GuidedTourDialog';

interface TourStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TourStatusDialog({ open, onOpenChange }: TourStatusDialogProps) {
  const { open: openGuide, close } = useGuideDialogStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(GUIDE_DIALOG_STORAGE_KEY);
    setDismissed(Boolean(stored));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tour status</DialogTitle>
          <DialogDescription>Reopen or reset the onboarding guide modal for this device.</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="font-medium">Onboarding guide</span>
            <span className={`text-sm font-semibold ${dismissed ? 'text-green-600' : 'text-blue-600'}`}>
              {dismissed ? 'Dismissed' : 'New'}
            </span>
            </div>
          <p className="mt-2 text-xs text-slate-500">
            Resetting the guide will show the walkthrough modal the next time you click "Guide me."
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(GUIDE_DIALOG_STORAGE_KEY);
              }
              close();
              openGuide();
              setDismissed(false);
            }}
            className="w-full sm:w-auto"
          >
            Reopen guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

