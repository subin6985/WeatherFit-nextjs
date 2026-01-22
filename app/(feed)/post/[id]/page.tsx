"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostDetail } from '../../../../types';
import { getPostById, toggleLike } from '../../../../lib/services/postService';
import { useAuth } from '../../../../hooks/useAuth';

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const postData = await getPostById(id, user?.uid);
        setPost(postData);
      } catch (e) {
        setError(e instanceof Error ? e.message : '게시글을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  const handleToggleLike = async () => {
    if (!post || !user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await toggleLike(post.id, user.uid);
      setPost(prev =>
          prev ? {
            ...prev,
            likes: result.likes,
            isLikedByMe: result.isLikedByMe,
          } : null
      );
    } catch (e) {
      console.error('Failed to toggle like:', e);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
          로딩 중...
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen">
          {error}
        </div>
    );
  }

  if (!post) return null;

  return (
      <div>
        <div className="flex flex-row gap-[9px] pl-[20px] pt-[18px] pb-[18px] items-center">
          {post.member.profilePhoto ? (
              <img
                  src={post.member.profilePhoto}
                  alt={post.member.nickname}
                  width={52}
                  height={52}
                  className="rounded-full object-cover"
              />
          ) : (
              <div className="w-[52px] h-[52px] rounded-full bg-light" />
          )}
          <div className="flex flex-col gap-[2px]">
            <div className="text-[16px] text-base">{post.member.nickname}</div>
            <div className="text-[16px] text-middle">
              {formatDate(post.createdAt)} · {post.temp}℃
            </div>
          </div>
        </div>

        <div>
          {post.photo ? (
              <img
                  src={post.photo}
                  alt="포스트 이미지"
                  className="w-full h-[393px] object-cover"
              />
          ) : (
              <div className="w-full h-[393px] bg-light" />
          )}
        </div>

        <div className="pt-[10px] pl-[20px] pr-[20px]">
          <button
              onClick={handleToggleLike}
              className="flex items-center gap-[5px] text-base text-[14px]"
          >
            <img
                src={post.isLikedByMe ? '/Heart-full.png' : '/Heart.png'}
                alt="좋아요"
                width={30}
                height={30}
            />
            {post.likes}
          </button>
        </div>

        <div className="text-[16px] p-[10px] whitespace-pre-line">
          {post.post}
        </div>
      </div>
  );
}