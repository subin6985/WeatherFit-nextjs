import {db} from "../firebase";
import {
  addDoc,
  collection,
  doc, getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from "firebase/firestore";

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  type: 'like' | 'comment' | 'reply';
  postId: string;
  commentId?: string; // 댓글/답글인 경우
  message: string;
  isRead: boolean;
  createdAt: number;
}

// 알림 생성
export const createNotification = async (data: {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  type: 'like' | 'comment' | 'reply';
  postId: string;
  commentId?: string;
  message: string;
}) => {
  // 자기 자신에게는 알림 안 보냄
  if (data.recipientId === data.senderId) return;

  const notificationsRef = collection(db, 'notifications');

  await addDoc(notificationsRef, {
    ...data,
    isRead: false,
    createdAt: Date.now(),
  });
};

// 실시간 알림 구독
export const subscribeNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];

    callback(notifications);
  })
};

// 알림 읽음 처리
export const markAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
  });
}

// 모든 알림 읽음 처리
export const markAllAsRead = async (userId: string) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      where('isRead', '==', false)
  )

  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { isRead: true })
  );

  await Promise.all(promises);
};