import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type StatKey =
  | 'totalPnL'
  | 'winRate'
  | 'openTrades'
  | 'bestTrade'
  | 'worstTrade'
  | 'avgWinLoss';

interface DashboardStatsState {
  visibleStats: Record<StatKey, boolean>;
  toggleStat: (key: StatKey) => void;
  resetStats: () => void;
}

const DEFAULT_VISIBILITY: Record<StatKey, boolean> = {
  totalPnL: true,
  winRate: true,
  openTrades: true,
  bestTrade: true,
  worstTrade: true,
  avgWinLoss: true,
};

export const useDashboardStatsStore = create<DashboardStatsState>()(
  persist(
    (set) => ({
      visibleStats: DEFAULT_VISIBILITY,
      toggleStat: (key) =>
        set((state) => ({
          visibleStats: {
            ...state.visibleStats,
            [key]: !state.visibleStats[key],
          },
        })),
      resetStats: () => set({ visibleStats: DEFAULT_VISIBILITY }),
    }),
    {
      name: 'dashboard-stats-visibility',
    }
  )
);

