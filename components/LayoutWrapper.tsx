'use client';

import { usePathname } from 'next/navigation';
import { useCommentStore } from '../store/useCommentStore';
import ChatModalContainer from "./chat/ChatModalContainer";
import {useEffect, useState} from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCommentOpen = useCommentStore((state) => state.isCommentOpen);
  const isPostPage = pathname?.startsWith('/post/');
  const shouldExpand = isPostPage && isCommentOpen;

  return (
      <div className={`h-screen w-full mx-auto bg-white transition-all duration-300 
                    ${shouldExpand ? 'max-w-[786px]' : 'max-w-[393px]'}`}>
        {children}
        <ChatModalContainer />
      </div>
  );
}