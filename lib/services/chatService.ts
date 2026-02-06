import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  participantPhotos: { [userId: string]: string };
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: { [userId: string]: number };
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

// 채팅방 생성 또는 가져오기
export const getOrCreateChatRoom = async (
    currentUserId: string,
    currentUserName: string,
    currentUserPhoto: string,
    otherUserId: string,
    otherUserName: string,
    otherUserPhoto: string
): Promise<string> => {
  const roomsRef = collection(db, 'chatRooms');

  // 두 사용자 간의 기존 채팅방 찾기
  const q = query(
      roomsRef,
      where(`participants`, 'array-contains', currentUserId)
  );

  const snapshot = await getDocs(q);
  const existingRoom = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.participants.includes(otherUserId);
  });

  if (existingRoom) {
    return existingRoom.id;
  }

  // 새 채팅방 생성
  const newRoom = await addDoc(roomsRef, {
    participants: [currentUserId, otherUserId],
    participantNames: {
      [currentUserId]: currentUserName,
      [otherUserId]: otherUserName,
    },
    participantPhotos: {
      [currentUserId]: currentUserPhoto,
      [otherUserId]: otherUserPhoto,
    },
    lastMessage: '',
    lastMessageTime: Date.now(),
    unreadCount: {
      [currentUserId]: 0,
      [otherUserId]: 0,
    },
    createdAt: Date.now(),
  });

  return newRoom.id;
}

// 채팅방 목록 실시간 구독
export const subscribeChatRooms = (
    userId: string,
    callback: (rooms: ChatRoom[]) => void
) => {
  const roomsRef = collection(db, 'chatRooms');
  const q = query(
      roomsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatRoom[];

    callback(rooms);
  });
};

// 메시지 저장 (Firebase에 영구 저장)
export const saveMessage = async (
    roomId: string,
    senderId: string,
    senderName: string,
    senderPhoto: string,
    message: string
) => {
  const messagesRef = collection(db, 'chatRooms', roomId, 'messages');

  const messageData = {
    roomId,
    senderId,
    senderName,
    senderPhoto,
    message,
    timestamp: Date.now(),
    isRead: false,
  };

  await addDoc(messagesRef, messageData);

  // 채팅방의 lastMessage 업데이트
  const roomRef = doc(db, 'chatRooms', roomId);
  await updateDoc(roomRef, {
    lastMessage: message,
    lastMessageTime: Date.now(),
  });

  return messageData;
};

// 메시지 목록 실시간 구독
export const subscribeMessages = (
    roomId: string,
    callback: (messages: ChatMessage[]) => void
) => {
  const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
  const q = query(
      messagesRef,
      orderBy('timestamp', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];

    callback(messages);
  });
};

// 메시지 읽음 처리
export const markMessagesAsRead = async (
    roomId: string,
    userId: string,
) => {
  const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
  const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('isRead', '==', false)
  )

  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { isRead: true })
  );

  return Promise.all(updatePromises);
}