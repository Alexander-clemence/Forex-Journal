'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Compass, Target } from 'lucide-react';
import { useGuideDialogStore } from '@/lib/stores/guideDialogStore';

export const GUIDE_DIALOG_STORAGE_KEY = 'guided-tour-dialog-dismissed-v1';

const sections = [
  {
    title: 'Dashboard essentials',
    items: [
      'Set your base balance before logging trades to keep percentages accurate.',
      'Review the stats cards for base balance, trade P&L, and current balance.',
      'Use Quick Actions for one-click access to Add Trade, Analytics, or Balance.',
    ],
  },
  {
    title: 'Account balance workflow',
    items: [
      'Use the Account Balance page to manage deposits and withdrawals.',
      'Update the Base Balance field whenever capital changes.',
      'Balance breakdown shows how base capital plus trade P&L forms the current balance.',
    ],
  },
  {
    title: 'Trade journaling',
    items: [
      'Required fields: symbol, side, quantity, entry price/date.',
      'Optional journal tabs capture strategy, mood, and lessons for analytics.',
      'Use the tips section to keep open trades updated and log notes consistently.',
    ],
  },
  {
    title: 'All trades, filters, and management',
    items: [
      'All Trades lists every entry with P&L, strategy tags, and status badges.',
      'Filter by status, mood, strategy, sentiment, or date range.',
      'Use the trade-card actions to view, edit, or delete entries in place.',
    ],
  },
  {
    title: 'Analytics, exports, and settings',
    items: [
      'Analytics tracks win rate, profit factor, mood insights, and strategy performance.',
      'Export data to CSV, PDF, or JSON and choose the exact date range.',
      'Settings let you adjust preferences, notifications, and privacy controls.',
    ],
  },
  {
    title: 'Shortcuts and best practices',
    items: [
      'Shift + N adds a trade, Shift + A opens analytics, Shift + ? opens the shortcuts panel.',
      'Apply the best-practices cards on the dashboard: stay consistent, track psychology, run weekly reviews.',
    ],
  },
];

export function GuidedTourDialog() {
  const { isOpen, open, close } = useGuideDialogStore();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShouldRender(true);

    const dismissed = window.localStorage.getItem(GUIDE_DIALOG_STORAGE_KEY);
    if (!dismissed) {
      const timer = window.setTimeout(() => open(), 400);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    close();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GUIDE_DIALOG_STORAGE_KEY, Date.now().toString());
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      open();
    } else {
      handleClose();
    }
  };

  if (!shouldRender) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[98vw] max-w-6xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <Compass className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <DialogTitle className="text-lg">Quick product walkthrough</DialogTitle>
              <DialogDescription className="text-sm">
                Here’s a fast overview of what to do on your first pass through the journal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </p>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleClose}>
            Dismiss
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              handleClose();
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


