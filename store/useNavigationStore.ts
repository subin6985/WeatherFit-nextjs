import { create } from 'zustand';

type Page = 'normal' | 'write' | 'feed' | 'mypage';

interface NavigationStore {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  currentPage: 'normal',
  setCurrentPage: (page) => set({ currentPage: page }),
  resetNavigation: () => set({ currentPage: 'normal' }),
}));