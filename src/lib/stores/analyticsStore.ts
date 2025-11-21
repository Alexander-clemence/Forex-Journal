import { create } from 'zustand';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export type AnalyticsTab = 'performance' | 'psychology' | 'strategy' | 'insights' | 'timeline';

interface AnalyticsState {
  timeRange: TimeRange;
  activeTab: AnalyticsTab;
  setTimeRange: (range: TimeRange) => void;
  setActiveTab: (tab: AnalyticsTab) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  timeRange: '30d',
  activeTab: 'performance',
  setTimeRange: (range) => set({ timeRange: range }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
