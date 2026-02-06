'use client';

import { useChatStore } from '../../store/useChatStore';
import ChatListModal from './ChatListModal';
import ChatRoomModal from './ChatRoomModal';

export default function ChatModalContainer() {
  const { isChatListOpen, activeChatRoomId } = useChatStore();

  return (
      <>
        {isChatListOpen && <ChatListModal />}
        {activeChatRoomId && <ChatRoomModal roomId={activeChatRoomId} />}
      </>
  )
}