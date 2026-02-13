'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import {
  subscribeMessages,
  saveMessage,
  markMessagesAsRead,
  ChatMessage, getOtherUserInfo,
} from '../../lib/services/chatService';

interface ChatRoomModalProps {
  roomId: string;
}

export default function ChatRoomModal({ roomId }: ChatRoomModalProps) {
  const { user } = useAuthStore();
  const { closeChatRoom, openChatList } = useChatStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [otherUserName, setOtherUserName] = useState<string>('');
  const [isOtherUserDeleted, setIsOtherUserDeleted] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 상대방 정보 로드
  useEffect(() => {
    if (!user || !roomId) return;

    const loadOtherUserInfo = async () => {
      try {
        const info = await getOtherUserInfo(roomId, user.uid);
        setOtherUserName(info.name);
        setIsOtherUserDeleted(info.isDeleted);
      } catch (error) {
        console.error('상대방 정보 로드 실패:', error);
        setOtherUserName('알 수 없음');
      }
    };

    loadOtherUserInfo();
  }, [roomId, user]);

  // 웹소켓 연결
  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('register', user.uid);
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('receive-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    newSocket.on('user-typing', (data) => {
      if (data.userId !== user.uid) {
        setTypingUser(data.isTyping ? data.userName : null);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-room', roomId);
      newSocket.close();
    };
  }, [roomId, user]);

  // Firebase 메시지 구독
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 메시지 읽음 처리
  useEffect(() => {
    if (!user || !roomId || messages.length === 0) return;

    const unreadMessages = messages.filter(
        msg => msg.senderId !== user.uid && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      markMessagesAsRead(roomId, user.uid);
    }
  }, [messages, user, roomId]);

  const sendMessage = async () => {
    if (isOtherUserDeleted) {
      alert('탈퇴한 회원에게는 메시지를 보낼 수 없습니다.');
      return;
    }

    if (!inputValue.trim() || !socket || !user) return;

    const messageData = {
      roomId,
      message: inputValue,
      senderId: user.uid,
      senderName: user.displayName || '익명',
      senderPhoto: user.photoURL || '',
      timestamp: Date.now(),
    };

    socket.emit('send-message', messageData);

    await saveMessage(
        roomId,
        user.uid,
        user.displayName || '익명',
        user.photoURL || '',
        inputValue
    );

    setInputValue('');

    if (isTyping) {
      socket.emit('typing', {
        roomId,
        userId: user.uid,
        userName: user.displayName,
        isTyping: false,
      });
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOtherUserDeleted) return;

    setInputValue(e.target.value);

    if (!socket || !user) return;

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socket.emit('typing', {
        roomId,
        userId: user.uid,
        userName: user.displayName,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', {
          roomId,
          userId: user.uid,
          userName: user.displayName,
          isTyping: false,
        });
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBack = () => {
    closeChatRoom();
    openChatList();
  };

  if (!user) return null;

  return (
      <>
        {/* 배경 오버레이 */}
        <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeChatRoom}
        />

        {/* 모달 */}
        <div className="fixed right-0 top-0 h-screen w-[393px] bg-white z-50 shadow-2xl flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-light">
            <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-200 rounded"
            >
              ← 뒤로
            </button>
            <div className="flex-1 text-center">
              <span className={`font-semibold ${isOtherUserDeleted ? 'text-gray-middle' : ''}`}>
                  {otherUserName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                  className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
              />
              <span className="text-sm text-middle">
              {isConnected ? '연결됨' : '연결 끊김'}
            </span>
            </div>
          </div>

          {/* 탈퇴 회원 안내 메시지 */}
          {isOtherUserDeleted && (
              <div className="bg-red-50 border-b border-red-200 px-4 py-2">
                <p className="text-sm text-red-600 text-center">
                  상대방이 탈퇴하여 더 이상 메시지를 보낼 수 없습니다.
                </p>
              </div>
          )}

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isMyMessage = msg.senderId === user.uid;

              return (
                  <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMyMessage && (
                          (msg.senderPhoto && !isOtherUserDeleted) ? (
                              <img
                                  src={msg.senderPhoto}
                                  alt={msg.senderName}
                                  className="w-8 h-8 rounded-full"
                              />
                          ) : (
                              <div className="w-8 h-8 rounded-full bg-light" />
                          )
                      )}

                      <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                        {!isMyMessage && (
                            <div className="text-xs text-middle mb-1">
                              {isOtherUserDeleted ? '(탈퇴한 회원)' : msg.senderName}
                            </div>
                        )}
                        <div
                            className={`inline-flex px-3 py-2 rounded-2xl ${
                                isMyMessage
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-base'
                            }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        </div>
                        <div className={`text-xs text-middle mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
              );
            })}

            {typingUser && (
                <div className="flex items-center gap-2 text-sm text-middle">
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                  </div>
                  {typingUser}님이 입력 중...
                </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div className="border-t border-light p-4">
            <div className="flex gap-2">
              <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={isOtherUserDeleted ? "메시지를 보낼 수 없습니다" : "메시지를 입력하세요"}
                  disabled={isOtherUserDeleted}
                  className="flex-1 px-4 py-2 border border-light rounded-full focus:outline-none focus:border-primary"
              />
              <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isOtherUserDeleted}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:bg-light disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </>
  );
}