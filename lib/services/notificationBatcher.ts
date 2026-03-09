import {db} from "../firebase";
import {collection, doc, writeBatch} from "firebase/firestore";

interface PendingNotification {
  recipientId: string;
  type: 'like' | 'comment';
  postId: string;
  senders: Map<string, { name: string; photo: string }>;
  lastUpdate: number;
}

class NotificationBatcher {
  private pending: Map<string, PendingNotification> = new Map();
  private batchInterval = 5000; // 5초마다 배치 처리
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startBatching();
  }

  // 알림 추가 (즉시 전송 X)
  addNotification(
      recipientId: string,
      senderId: string,
      senderName: string,
      senderPhoto: string,
      type: 'like' | 'comment',
      postId: string
  ) {
    const key = `${recipientId}-${type}-${postId}`;

    if (this.pending.has(key)) {
      // 기존 알림에 발신자 추가
      const notification = this.pending.get(key)!;
      notification.senders.set(senderId, { name: senderName, photo: senderPhoto });
      notification.lastUpdate = Date.now();
    } else {
      // 새 알림 생성
      this.pending.set(key, {
        recipientId,
        type,
        postId,
        senders: new Map([[senderId, { name: senderName, photo: senderPhoto }]]),
        lastUpdate: Date.now()
      });
    }
  }

  // 배치 처리 시작
  private startBatching() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.flush();
      }, this.batchInterval);
    }
  }

  // 모인 알림들 한번에 전송
  private async flush() {
    if (this.pending.size === 0) return;

    const notifications = Array.from(this.pending.values());
    this.pending.clear();

    // Firestore에 배치로 저장
    const batch = writeBatch(db);

    for (const notification of notifications) {
      const senderList = Array.from(notification.senders.values());
      const senderNames = senderList.map(s => s.name);

      const message = this.formatMessage(notification.type, senderNames);

      const notifRef = doc(collection(db, 'notifications'));

      batch.set(notifRef, {
        recipientId: notification.recipientId,
        type: notification.type,
        postId: notification.postId,
        senderName: senderNames[0],
        senderPhoto: senderList[senderList.length - 1].photo,
        message,
        isRead: false,
        createdAt: Date.now(),
      });
    }

    await batch.commit();
    console.log(`${notifications.length}개 알림 배치 전송 완료`);
  }

  // 메시지 포맷팅
  private formatMessage(type: 'like' | 'comment', names: string[]): string {
    const count = names.length;

    if (type === 'like') {
      if (count === 1) {
        return `${names[0]}님이 회원님의 게시물을 좋아합니다.`;
      } else if (count === 2) {
        return `${names[0]}님과 ${names[1]}님이 회원님의 게시물을 좋아합니다.`;
      } else {
        return `${names[0]}님 외 ${count - 1}명이 회원님의 게시물을 좋아합니다.`;
      }
    } else {
      if (count === 1) {
        return `${names[0]}님이 댓글을 남겼습니다.`;
      } else {
        return `${names[0]}님 외 ${count - 1}명이 댓글을 남겼습니다.`;
      }
    }
  }

  // 정리
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.pending.clear();
  }
}

export const notificationBatcher = new NotificationBatcher();