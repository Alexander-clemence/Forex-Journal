'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { useTourStore } from '@/lib/stores/tourStore';
import { usePathname } from 'next/navigation';

type Step = {
  selector: string;
  title: string;
  description: string;
};

const tourSteps: Record<string, Step[]> = {
  dashboard: [
    {
      selector: '[data-tour="stats-grid"]',
      title: 'Customize your stats',
      description:
        'Use the new Customize button to pin the metrics that matter most for your trading routine.',
    },
    {
      selector: '[data-tour="quick-actions"]',
      title: 'Faster trade actions',
      description: 'Jump into balance updates, exports, and new trades from this always-on toolkit.',
    },
    {
      selector: '[data-tour="analytics-preview"]',
      title: 'Deep analytics',
      description: 'Compare performance periods or drill into the new timeline tab to spot streaks.',
    },
    {
      selector: '[data-tour="shortcuts-hint"]',
      title: 'Keyboard shortcuts',
      description: 'Press Shift + / anytime to revisit this tour or explore productivity boosters.',
    },
  ],
  trades: [
    {
      selector: '[data-tour="filters-heading"]',
      title: 'Powerful filters',
      description: 'Search by symbol, mood, preset and more to find trades instantly.',
    },
    {
      selector: '[data-tour="results-heading"]',
      title: 'Adaptive list',
      description: 'Cards resize and load automatically. Scroll to fetch more without leaving the page.',
    },
    {
      selector: '[data-tour="quick-actions"]',
      title: 'One-click actions',
      description: 'Import, export, or add trades from anywhere in the workspace.',
    },
  ],
  analytics: [
    {
      selector: '[data-tour="analytics-heading"]',
      title: 'Time range presets',
      description: 'Adjust the range globally to update all analytics tabs at once.',
    },
    {
      selector: '[data-tour="tabs-list"]',
      title: 'Deep dive tabs',
      description: 'Switch between performance, psychology, strategy, and timeline views.',
    },
    {
      selector: '[data-tour="comparison-cards"]',
      title: 'Period comparisons',
      description: 'See how the current range stacks up against the previous period.',
    },
  ],
  login: [
    {
      selector: '[data-tour="login-form"]',
      title: 'Secure login',
      description: 'Email and password stay encrypted in transit. Use the eye icon to preview input.',
    },
    {
      selector: '[data-tour="login-highlights"]',
      title: 'Value highlights',
      description: 'We remind new users of key benefits while they prepare to sign in.',
    },
  ],
};

const HIGHLIGHT_PADDING = 12;

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TourName = keyof typeof tourSteps;

type FeatureTourProps = {
  tour?: TourName;
  stepsOverride?: Step[];
};

const mapPathToTour = (path?: string | null): TourName => {
  if (!path) return 'dashboard';
  if (path.startsWith('/dashboard/trades')) return 'trades';
  if (path.startsWith('/dashboard/analytics')) return 'analytics';
  if (path.startsWith('/login')) return 'login';
  return 'dashboard';
};

export function FeatureTour({ tour, stepsOverride }: FeatureTourProps) {
  const pathname = usePathname();
  const resolvedTour = tour ?? mapPathToTour(pathname);
  const { isOpen, hasSeen, step, next, previous, close, open, setSteps, reset } = useTourStore();
  const [highlightRect, setHighlightRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const steps = stepsOverride ?? tourSteps[resolvedTour] ?? tourSteps.dashboard;
  const hasSeenCurrent = hasSeen[resolvedTour] ?? false;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setHighlightRect(null);
      return;
    }
    if (typeof window === 'undefined') return;

    const updateRect = () => {
      const activeStep = steps[safeStepIndex];
      const el = document.querySelector(activeStep.selector) as HTMLElement | null;
      if (!el) {
        setHighlightRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const adjustedTop = Math.max(rect.top - HIGHLIGHT_PADDING, 0);
      const adjustedLeft = Math.max(rect.left - HIGHLIGHT_PADDING, 0);
      setHighlightRect({
        top: adjustedTop,
        left: adjustedLeft,
        width: rect.width + HIGHLIGHT_PADDING * 2,
        height: rect.height + HIGHLIGHT_PADDING * 2,
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isOpen, step]);

  useEffect(() => {
    setSteps(steps.length);
    if (!hasSeenCurrent) {
      const timer = setTimeout(() => {
        open(resolvedTour, steps.length);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenCurrent, open, resolvedTour, setSteps, steps.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shouldReset = params.get('resetTour');
    if (shouldReset) {
      reset();
      params.delete('resetTour');
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? `?${newSearch}` : '') +
        window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, [reset]);

  if (!isOpen || steps.length === 0) {
    return null;
  }

  const safeStepIndex = Math.min(step, steps.length - 1);
  const activeStep = steps[safeStepIndex];
  if (!activeStep) {
    return null;
  }

  const overlays: Array<{ key: string; style: CSSProperties }> = [];

  if (highlightRect && viewport.width && viewport.height) {
    const holeRight = Math.min(highlightRect.left + highlightRect.width, viewport.width);
    const holeBottom = Math.min(highlightRect.top + highlightRect.height, viewport.height);
    overlays.push(
      {
        key: 'top',
        style: { top: 0, left: 0, width: '100vw', height: highlightRect.top },
      },
      {
        key: 'left',
        style: {
          top: highlightRect.top,
          left: 0,
          width: highlightRect.left,
          height: highlightRect.height,
        },
      },
      {
        key: 'right',
        style: {
          top: highlightRect.top,
          left: holeRight,
          width: Math.max(viewport.width - holeRight, 0),
          height: highlightRect.height,
        },
      },
      {
        key: 'bottom',
        style: {
          top: holeBottom,
          left: 0,
          width: '100vw',
          height: Math.max(viewport.height - holeBottom, 0),
        },
      }
    );
  } else {
    overlays.push({ key: 'full', style: { top: 0, left: 0, width: '100vw', height: '100vh' } });
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {overlays.map((segment) => (
        <div
          key={segment.key}
          className="pointer-events-auto absolute bg-black/55 backdrop-blur-sm transition-all"
          style={segment.style}
        />
      ))}
      {highlightRect && (
        <div
          className="pointer-events-none fixed border-2 border-blue-400/80 rounded-xl ring-4 ring-blue-400/20 transition-all"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}
      <div className="pointer-events-auto fixed bottom-3 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto max-w-sm sm:max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-border p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-500 mb-1">
            Step {step + 1} of {steps.length}
          </p>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{activeStep.title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{activeStep.description}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={close} className="w-full sm:w-auto text-xs sm:text-sm">
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previous} disabled={step === 0} className="text-xs sm:text-sm flex-1 sm:flex-none">
              Back
            </Button>
            <Button size="sm" onClick={next} className="text-xs sm:text-sm flex-1 sm:flex-none">
              {step === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

