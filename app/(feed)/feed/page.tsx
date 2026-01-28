"use client";

import { useEffect } from 'react';
import { getPosts } from '../../../lib/services/postService';
import {useAuthStore} from "../../../store/useAuthStore";
import {useNavigationStore} from "../../../store/useNavigationStore";
import FeedGrid from "../../../components/FeedGrid";

export default function FeedPage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { setCurrentPage } = useNavigationStore();

  useEffect(() => {
    setCurrentPage('feed');
  }, []);

  return (
      <FeedGrid
        showWriteButton={isLoggedIn}
        fetchFunction={getPosts}
        emptyMessage="게시물이 없습니다."
      />
  );
}