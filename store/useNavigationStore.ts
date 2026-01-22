import { create } from 'zustand';

type FeedPage = 'feed' | 'post' | 'write';

interface NavigationStore {
  currentPage: FeedPage;
  setCurrentPage: (page: FeedPage) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  currentPage: 'feed',
  setCurrentPage: (page) => set({ currentPage: page }),
  resetNavigation: () => set({ currentPage: 'feed' }),
}));