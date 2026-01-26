import { create } from 'zustand';

type FeedPage = 'feed' | 'post' | 'write';
type Mypage = 'mypage' | 'detail' | 'password';

// 각 페이지의 루트 페이지 정의
const PAGE_ROOTS: Record<FeedPage | Mypage, FeedPage | Mypage> = {
  feed: 'feed',
  post: 'feed',
  write: 'feed',
  mypage: 'mypage',
  detail: 'mypage',
  password: 'mypage',
};

interface NavigationStore {
  currentPage: FeedPage | Mypage;
  setCurrentPage: (page: FeedPage | Mypage) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  currentPage: 'feed',
  setCurrentPage: (page) => set({ currentPage: page }),
  resetNavigation: (page) => set({ currentPage: PAGE_ROOTS[page] }),
}));