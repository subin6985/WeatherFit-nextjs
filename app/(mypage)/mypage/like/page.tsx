"use client";

import {useNavigationStore} from "../../../../store/useNavigationStore";
import {useCallback, useEffect} from "react";
import FeedGrid from "../../../../components/feed/FeedGrid";
import {useRouter} from "next/navigation";
import {useAuthStore} from "../../../../store/useAuthStore";
import {getLikedPosts} from "../../../../lib/services/postService";

export default function LikePage () {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuthStore();
  const { setCurrentPage } = useNavigationStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn || !user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
  }, [user, isLoading, isLoading, router]);

  useEffect(() => {
    setCurrentPage('normal');
  }, []);

  const fetchLikedPosts = useCallback(
      (lastDoc, pageSize, filters) => {
        if (!user?.uid) {
          return Promise.resolve({ posts: [], lastDoc: null, hasMore: false });
        }
        return getLikedPosts(user.uid, lastDoc, pageSize, filters);
      },
      [user?.uid]
  );

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
          로딩 중...
        </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
      <FeedGrid
          title="좋아요 한 게시물"
          fetchFunction={fetchLikedPosts}
          emptyMessage="좋아요 한 게시물이 없습니다."
      />
  );
}