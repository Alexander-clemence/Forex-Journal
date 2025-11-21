'use client';

/**
 * WhatsNewDialog Component
 * 
 * This dialog automatically displays when the dashboard is rendered for the first time
 * after a content update. It shows for 7 days after the RELEASE_DATE.
 * 
 * HOW TO UPDATE THIS COMPONENT:
 * ==============================
 * 1. Update the 'highlights' array with your new features/changes
 * 2. Update RELEASE_DATE to the current date (format: 'YYYY-MM-DDTHH:MM:SSZ')
 * 3. The counter will automatically reset for all users when RELEASE_DATE changes
 * 4. Users will see the popup again with the new content
 * 
 * The 7-day counter is displayed in the dialog showing how many days remain
 * before the popup stops appearing automatically.
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

// ⚠️ IMPORTANT: Update this date whenever you change the highlights below
// This date determines when the 7-day counter starts and creates a unique storage key
const RELEASE_DATE = new Date('2025-11-21T00:00:00Z');
const DISPLAY_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// IMPORTANT: Whenever you update these highlights, also update RELEASE_DATE above
// This ensures the popup shows again for all users with the new content
const highlights = [
  {
    title: 'Advanced Trade Filters',
    description: 'Filter your trades by pair, type, date range, and more. Save time finding specific trades with powerful filtering options.'
  },
  {
    title: 'Interactive Guide Tour',
    description: 'New "Guide me" button in the header! Get interactive walkthroughs of dashboard features with step-by-step tours for all major sections.'
  },
  {
    title: 'Direct Email Feedback',
    description: 'Quickly contact support with the feedback button in the header. Send bug reports, feature requests, or general feedback directly to our team.'
  },
  {
    title: 'Enhanced UI & Typography',
    description: 'Improved section headings, better visual hierarchy, and polished titles throughout the dashboard for a more professional experience.'
  },
  {
    title: 'Customize Options',
    description: 'New customization features to personalize your trading journal experience with flexible layouts and preferences.'
  },
  {
    title: 'Mobile Responsive Design',
    description: 'All features work seamlessly on mobile, tablet, and desktop with optimized layouts for every screen size.'
  }
];

// Create a unique storage key based on release date
const STORAGE_KEY = `whats-new-dismissed-${RELEASE_DATE.toISOString().split('T')[0]}`;

export function WhatsNewDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const now = Date.now();
    const releaseTime = RELEASE_DATE.getTime();
    const expiresAt = releaseTime + DISPLAY_DURATION_MS;

    // Check if we're still within the 7-day display window
    if (now > expiresAt) {
      return;
    }

    setShouldRender(true);

    const dismissed = globalThis.window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (globalThis.window !== undefined) {
      globalThis.window.localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[85vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">What's new in your trading journal</DialogTitle>
          </div>
          <DialogDescription className="text-sm sm:text-base">
            Thanks for using the journal! Here are the highlights from the latest release.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 sm:px-6 py-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="flex items-start space-x-3 rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                  {item.title}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto sm:flex-1 text-sm sm:text-base" 
            onClick={handleClose}
          >
            Remind me later
          </Button>
          <Button 
            className="w-full sm:w-auto sm:flex-1 text-sm sm:text-base" 
            onClick={handleClose}
          >
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}