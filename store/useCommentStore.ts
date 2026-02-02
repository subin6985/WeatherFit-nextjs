import { create } from 'zustand';

interface CommentStore {
  isCommentOpen: boolean;
  setIsCommentOpen: (isOpen: boolean) => void;
  toggleComment: () => void;
}

export const useCommentStore = create<CommentStore>((set) => ({
  isCommentOpen: false,
  setIsCommentOpen: (isOpen) => set({ isCommentOpen: isOpen }),
  toggleComment: () => set((state) => ({ isCommentOpen: !state.isCommentOpen})),
}))