import { create } from 'zustand';
import type { TradeFilters } from '@/lib/types/trades';

const ITEMS_PER_PAGE = 15;

export type SortField = 'date' | 'pnl' | 'symbol';
export type SortOrder = 'asc' | 'desc';

interface TradeListState {
  searchTerm: string;
  debouncedSearch: string;
  showFilters: boolean;
  filters: TradeFilters;
  sortBy: SortField;
  sortOrder: SortOrder;
  displayedTrades: number;
  isLoadingMore: boolean;
  setSearchTerm: (term: string) => void;
  setDebouncedSearch: (term: string) => void;
  toggleFilters: () => void;
  setFilters: (filters: TradeFilters) => void;
  setSort: (sortBy: SortField, sortOrder: SortOrder) => void;
  setDisplayedTrades: (count: number) => void;
  increaseDisplayedTrades: (maxCount: number) => void;
  setIsLoadingMore: (loading: boolean) => void;
  resetDisplayedTrades: () => void;
  resetState: () => void;
}

const initialState = {
  searchTerm: '',
  debouncedSearch: '',
  showFilters: false,
  filters: {},
  sortBy: 'date' as SortField,
  sortOrder: 'desc' as SortOrder,
  displayedTrades: ITEMS_PER_PAGE,
  isLoadingMore: false,
};

export const useTradeListStore = create<TradeListState>((set) => ({
  ...initialState,
  setSearchTerm: (term) => set({ searchTerm: term }),
  setDebouncedSearch: (term) => set({ debouncedSearch: term }),
  toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
  setFilters: (filters) => set({ filters }),
  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),
  setDisplayedTrades: (count) => set({ displayedTrades: count }),
  increaseDisplayedTrades: (maxCount) =>
    set((state) => ({
      displayedTrades: Math.min(state.displayedTrades + ITEMS_PER_PAGE, maxCount),
    })),
  setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
  resetDisplayedTrades: () => set({ displayedTrades: ITEMS_PER_PAGE }),
  resetState: () => set(initialState),
}));
