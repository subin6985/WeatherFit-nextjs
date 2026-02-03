'use client';

import { useEffect, useState } from 'react';
import {useAuthStore} from "../store/useAuthStore";
import {subscribeNotifications, markAsRead, markAllAsRead, Notification} from "../lib/services/notificationService";
import {useRouter} from "next/navigation";
import {useCommentStore} from "../store/useCommentStore";

export default function NotificationBell() {
  const { user } = useAuthStore.getState();
  const router = useRouter();
  const {setIsCommentOpen} = useCommentStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    await markAllAsRead(user.uid);
  };

  const handleNotificationClick = (notificationId: string, postId: string) => {
    handleMarkAsRead(notificationId);
    setIsCommentOpen(true);
    router.push(`/post/${postId}`);
    return;
  }

  return (
      <div className="relative mb-[13px]">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-0"
        >
          <img src="/Bell.png" alt="알림" width={40} height={40} />
          {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-warning text-snow text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
          )}
        </button>

        {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-snow rounded-lg shadow-lg border border-light max-h-96 overflow-y-auto z-50">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-bold">알림</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-primary"
                    >
                      모두 읽음
                    </button>
                )}
              </div>

              {notifications.length === 0 ? (
                  <div className="p-4 text-center text-middle">
                    알림이 없습니다
                  </div>
              ) : (
                  notifications.map((notification) => (
                      <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id, notification.postId)}
                          className={`p-4 border-b cursor-pointer hover:bg-snow ${
                              !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.senderPhoto ? (
                              <img
                                  src={notification.senderPhoto}
                                  alt={notification.senderName}
                                  className="w-10 h-10 rounded-full"
                              />
                          ) : (
                              <div className="w-10 h-10 rounded-full bg-light" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-middle mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                  ))
              )}
            </div>
        )}
      </div>
  );
}