"use client";

import { useEffect } from 'react';
import { getPosts } from '../../../lib/services/postService';
import {useAuthStore} from "../../../store/useAuthStore";
import {useNavigationStore} from "../../../store/useNavigationStore";
import FeedGrid from "../../../components/feed/FeedGrid";
import {useCommentStore} from "../../../store/useCommentStore";

export default function FeedPage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { setCurrentPage } = useNavigationStore();
  const { setIsCommentOpen } = useCommentStore();

  useEffect(() => {
    setCurrentPage('normal');
    setIsCommentOpen(false);
  }, []);

  return (
      <FeedGrid
        showWriteButton={isLoggedIn}
        fetchFunction={getPosts}
        emptyMessage="게시물이 없습니다."
      />
  );
}