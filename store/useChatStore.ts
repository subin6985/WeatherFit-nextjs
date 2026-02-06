import { create } from 'zustand';

interface ChatStore {
  // 채팅 목록 모달
  isChatListOpen: boolean;
  openChatList: () => void;
  closeChatList: () => void;

  // 채팅방 모달
  activeChatRoomId: string | null;
  openChatRoom: (roomId: string) => void;
  closeChatRoom: () => void;

  closeAll: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isChatListOpen: false,
  openChatList: () => set({ isChatListOpen: true, activeChatRoomId: null }),
  closeChatList: () => set({ isChatListOpen: false }),

  activeChatRoomId: null,
  openChatRoom: (roomId) => set({
    activeChatRoomId: roomId,
    isChatListOpen: false
  }),
  closeChatRoom: () => set({
    activeChatRoomId: null,
    isChatListOpen: true
  }),

  cloaseAll: () => set({
    isChatListOpen: false,
    activeChatRoomId: null
  }),
}));