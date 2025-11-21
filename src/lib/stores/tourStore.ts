'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TourKey = 'dashboard' | 'trades' | 'analytics' | 'login';

interface TourState {
  step: number;
  isOpen: boolean;
  currentTour: TourKey;
  hasSeen: Record<TourKey, boolean>;
  totalSteps: number;
  open: (tour?: TourKey, steps?: number) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
  setSteps: (count: number) => void;
  reset: () => void;
}

const DEFAULT_STEPS = 4;
const INITIAL_HAS_SEEN: Record<TourKey, boolean> = {
  dashboard: false,
  trades: false,
  analytics: false,
  login: false,
};

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      step: 0,
      isOpen: false,
      currentTour: 'dashboard',
      totalSteps: DEFAULT_STEPS,
      hasSeen: { ...INITIAL_HAS_SEEN },
      open: (tour = 'dashboard', steps = DEFAULT_STEPS) =>
        set({ isOpen: true, step: 0, currentTour: tour, totalSteps: steps }),
      close: () =>
        set((state) => ({
          isOpen: false,
          hasSeen: { ...state.hasSeen, [state.currentTour]: true }
        })),
      next: () => {
        const currentStep = get().step;
        const totalSteps = get().totalSteps;
        if (currentStep < totalSteps - 1) {
          set({ step: currentStep + 1 });
        } else {
          set((state) => ({
            isOpen: false,
            hasSeen: { ...state.hasSeen, [state.currentTour]: true }
          }));
        }
      },
      previous: () => {
        const currentStep = get().step;
        if (currentStep > 0) {
          set({ step: currentStep - 1 });
        }
      },
      setSteps: (count) => set({ totalSteps: count }),
      reset: () =>
        set({
          step: 0,
          isOpen: false,
          currentTour: 'dashboard',
          totalSteps: DEFAULT_STEPS,
          hasSeen: { ...INITIAL_HAS_SEEN },
        }),
    }),
    {
      name: 'feature-tour-state',
      version: 2,
      migrate: (state: any, version) => {
        if (!state) return state;
        if (version < 2) {
          const legacySeen = typeof state.hasSeen === 'boolean' ? state.hasSeen : false;
          return {
            ...state,
            hasSeen: {
              dashboard: legacySeen,
              trades: false,
              analytics: false,
              login: false,
            },
            currentTour: 'dashboard',
            totalSteps: state.totalSteps ?? DEFAULT_STEPS,
          };
        }
        return state;
      },
    }
  )
);

