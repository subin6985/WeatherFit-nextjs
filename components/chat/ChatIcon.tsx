import { subscribeChatRooms } from "../../lib/services/chatService";
import {useEffect, useState} from "react";
import {useAuthStore} from "../../store/useAuthStore";
import Image from "next/image";

export default function ChatIcon({onClick}) {
  const { user } = useAuthStore.getState();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeChatRooms(user.uid, newChats => {
      const totalUnread = newChats.reduce((total, chat) => {
        return total + (chat.unreadCount[user.uid] || 0);
      }, 0);

      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [user]);

  return (
      <div className="relative">
        <button onClick={onClick}>
          <Image
              src="/Chat.png"
              alt="Chat"
              width={35}
              height={35}
              sizes="35px"
          />
          {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-warning text-snow text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
          )}
        </button>
      </div>
  )
}