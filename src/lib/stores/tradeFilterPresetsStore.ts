'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TradeFilters } from '@/lib/types/trades';
import type { SortField, SortOrder } from './tradeListStore';

export interface TradeFilterPreset {
  id: string;
  name: string;
  searchTerm: string;
  filters: TradeFilters;
  sortBy: SortField;
  sortOrder: SortOrder;
}

interface TradeFilterPresetsState {
  presets: TradeFilterPreset[];
  savePreset: (preset: Omit<TradeFilterPreset, 'id'>) => { id: string };
  deletePreset: (id: string) => void;
  clearPresets: () => void;
}

export const useTradeFilterPresetsStore = create<TradeFilterPresetsState>()(
  persist(
    (set) => ({
      presets: [],
      savePreset: (preset) => {
        const id =
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set((state) => ({
          presets: [...state.presets, { ...preset, id }]
        }));
        return { id };
      },
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id)
        })),
      clearPresets: () => set({ presets: [] })
    }),
    {
      name: 'trade-filter-presets'
    }
  )
);

