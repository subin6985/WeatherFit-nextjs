"use client";

import { useRouter } from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import { useParams } from 'next/navigation';
import { PostDetail } from '../../../../types';
import {deletePost, getPostById, toggleLike} from '../../../../lib/services/postService';
import { useAuthStore } from "../../../../store/useAuthStore";
import {useNavigationStore} from "../../../../store/useNavigationStore";

export default function PostPage() {
  const { id } = useParams();
  const { setCurrentPage } = useNavigationStore();
  const { user } = useAuthStore.getState();
  const router = useRouter();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage('post');
  }, []);

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

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  const handleToggleLike = async () => {
    if (!post || !user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (user?.uid === post.member.memberId) {
      alert('본인 글에는 좋아요 할 수 없습니다.');
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

  const handleEdit = () => {
    router.push(`/post/${id}/edit`);
  }

  const handleDelete = async () => {
    const ok = confirm("이 글을 삭제하시겠습니까?");

    if (!ok || user?.uid !== post.member.memberId) {
      setOpenMenu(false);
      return;
    }

    try {
      const result = await deletePost(id, user?.uid);

      if (result) {
        router.push("/feed");
      }
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("게시글 삭제에 실패했습니다.");
    }
  }

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
        <div className="flex px-[20px] py-[18px] items-center justify-between">
          <div className="flex flex-row gap-[9px]">
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
          {
            (post.member.memberId === user?.uid) && (
                <div className="flex justify-end" ref={menuRef}>
                  <button onClick={() => setOpenMenu(prev => !prev)}>
                    <img
                      src="/Kebab-Menu.png"
                      alt="menu"
                      width={36}
                      height={36}
                    />
                  </button>
                  {openMenu && (
                      <div className="absolute mt-[40px]
                            flex flex-col w-[60px] p-[5px] shadow-[2px_2px_4px_rgba(0,0,0,0.25)]
                            bg-white border-[1px] border-light rounded-[10px]">
                        <button
                            className="hover:bg-snow rounded p-[3px]"
                            onClick={handleEdit}
                        >
                          수정
                        </button>
                        <button
                            className="hover:bg-snow rounded p-[3px] text-warning"
                            onClick={handleDelete}
                        >
                          삭제
                        </button>
                      </div>
                  )}
                </div>
              )
          }
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

        <div className="pt-[10px] pl-[10px]">
          <button
              onClick={handleToggleLike}
              className="flex items-center gap-[10px] text-base text-[14px]"
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