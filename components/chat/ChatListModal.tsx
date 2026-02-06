'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { subscribeChatRooms, ChatRoom } from "../../lib/services/chatService";

export default function ChatListModal() {
  const { user } = useAuthStore();
  const { closeChatList, openChatRoom } = useChatStore();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeChatRooms(user.uid, (rooms) => {
      setChatRooms(rooms);
    });

    return () => unsubscribe();
  }, [user]);

  const getOtherUser = (room: ChatRoom) => {
    const otherUserId = room.participants.find(id => id !== user.uid);
    return {
      id: otherUserId,
      name: room.participantNames[otherUserId || ''],
      photo: room.participantPhotos[otherUserId || ''],
    };
  };

  const handleRoomClick = (roomId: string) => {
    openChatRoom(roomId);
  };

  return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeChatList}
        />

        {/* 채팅 모달 */}
        <div className="fixed right-0 top-0 h-screen w-[393px] bg-white z-50 shadow-2xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-light">
            <h2 className="text-xl font-bold">채팅</h2>
            <button
              onClick={closeChatList}
              className="p-2 hover:bg-light rounded"
            >
              <img src="/Close.png" alt="닫기" width={24} height={24} />
            </button>
          </div>

          {/* 채팅 목록 */}
          <div className="overflow-y-auto h-[calc(100vh-60px)]">
            {chatRooms.length === 0 ? (
                <div className="p-8 text-center text-middle">
                  채팅 내역이 없습니다.
                </div>
            ) : (
                <div className="divide-y divide-light">
                  {chatRooms.map((room) => {
                    const otherUser = getOtherUser(room);
                    const unreadCount = room.unreadCount[user?.uid || ''] || 0;

                    return (
                        <div
                          key={room.id}
                          onClick={() => handleRoomClick(room.id)}
                          className="flex items-center gap-3 p-4 hover:bg-light cursor-pointer"
                        >
                          {otherUser.photo ? (
                              <img
                                src={otherUser.photo}
                                alt={otherUser.name}
                                className="w-12 h-12 rounded-full"
                              />
                          ) : (
                              <div className="w-12 h-12 rounded-full bg-light" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{otherUser.name}</span>
                              <span className="text-xs text-middle">
                                {new Date(room.lastMessageTime).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-middle truncate">
                              {room.lastMessage || '채팅을 시작해보세요'}
                            </p>
                          </div>

                          {unreadCount > 0 && (
                              <div className="bg-warning text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </>
  );
}