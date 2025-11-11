import { create } from 'zustand';

interface TradeModalState {
  viewTradeId: string | null;
  editTradeId: string | null;
  deleteTradeId: string | null;
  openView: (tradeId: string) => void;
  openEdit: (tradeId: string) => void;
  openDelete: (tradeId: string) => void;
  closeView: () => void;
  closeEdit: () => void;
  closeDelete: () => void;
  closeAll: () => void;
}

export const useTradeModalStore = create<TradeModalState>((set) => ({
  viewTradeId: null,
  editTradeId: null,
  deleteTradeId: null,
  openView: (tradeId) => set({ viewTradeId: tradeId }),
  openEdit: (tradeId) => set({ editTradeId: tradeId }),
  openDelete: (tradeId) => set({ deleteTradeId: tradeId }),
  closeView: () => set({ viewTradeId: null }),
  closeEdit: () => set({ editTradeId: null }),
  closeDelete: () => set({ deleteTradeId: null }),
  closeAll: () => set({ viewTradeId: null, editTradeId: null, deleteTradeId: null }),
}));
