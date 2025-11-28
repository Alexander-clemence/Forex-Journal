'use client';

import { create } from 'zustand';

interface GuideDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useGuideDialogStore = create<GuideDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));


