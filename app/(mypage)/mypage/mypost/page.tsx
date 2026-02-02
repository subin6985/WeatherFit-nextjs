"use client";

import {useNavigationStore} from "../../../../store/useNavigationStore";
import {useCallback, useEffect} from "react";
import FeedGrid from "../../../../components/feed/FeedGrid";
import {useRouter} from "next/navigation";
import {useAuthStore} from "../../../../store/useAuthStore";
import {getMyPosts} from "../../../../lib/services/postService";

export default function MypostPage () {
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

  const fetchMyPosts = useCallback(
      (lastDoc, pageSize, filters) => {
        if (!user?.uid) {
          return Promise.resolve({ posts: [], lastdoc: null, hasMore: false });
        }
        return getMyPosts(user.uid, lastDoc, pageSize, filters);
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
          title="내가 작성한 게시물"
          fetchFunction={fetchMyPosts}
          emptyMessage="내가 작성한 게시물이 없습니다."
      />
  );
}