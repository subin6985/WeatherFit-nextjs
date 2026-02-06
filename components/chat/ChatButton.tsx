'use client';

import { useState } from 'react';
import { useAuthStore } from "../../store/useAuthStore";
import { getOrCreateChatRoom } from "../../lib/services/chatService";
import Button from "../baseUI/Button";
import {useChatStore} from "../../store/useChatStore";

interface ChatButtonProps {
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string;
}

export default function ChatButton({ otherUserId, otherUserName, otherUserPhoto }: ChatButtonProps) {
  const { user } = useAuthStore();
  const { openChatRoom } = useChatStore();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (user.uid === otherUserId) {
      alert('자기 자신과는 채팅할 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      const roomId = await getOrCreateChatRoom(
          user.uid,
          user.displayName || '익명',
          user.photoURL || '',
          otherUserId,
          otherUserName,
          otherUserPhoto
      );

      openChatRoom(roomId);
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert('채팅방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <Button onClick={handleStartChat} disabled={loading}>
        {loading ? '로딩 중...' : '1:1 채팅'}
      </Button>
  );
}