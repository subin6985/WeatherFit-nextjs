'use client';

import { usePathname } from 'next/navigation';
import { useCommentStore } from '../store/useCommentStore';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCommentOpen = useCommentStore((state) => state.isCommentOpen);
  const isPostPage = pathname?.startsWith('/post/');
  const shouldExpand = isPostPage && isCommentOpen;

  return (
      <div className={`h-screen mx-auto bg-white transition-all duration-300 
                    ${shouldExpand ? 'w-[786px]' : 'w-[393px]'}`}>
        {children}
      </div>
  );
}