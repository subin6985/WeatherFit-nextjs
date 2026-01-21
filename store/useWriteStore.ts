import { create } from 'zustand';

interface WriteStore {
  step: number;
  setStep: (step: number) => void;
  resetStep: () => void;
}

export const useWriteStore = create<WriteStore>((set) => ({
  step: 1,
  setStep: (step) => set({ step }),
  resetStep: () => set({ step: 1 }),
}));