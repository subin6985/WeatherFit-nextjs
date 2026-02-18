"use client";

import { useRouter } from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import { useParams } from 'next/navigation';
import { PostDetail } from '../../../../types';
import {deletePost, getPostById, subscribeLikes, toggleLike} from '../../../../lib/services/postService';
import { useAuthStore } from "../../../../store/useAuthStore";
import {useNavigationStore} from "../../../../store/useNavigationStore";
import CommentSection from "../../../../components/comment/CommentSection";
import {subscribeCommentCount} from "../../../../lib/services/commentService";
import {useCommentStore} from "../../../../store/useCommentStore";
import ChatButton from "../../../../components/chat/ChatButton";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();

  const { setCurrentPage } = useNavigationStore();
  const { user } = useAuthStore.getState();
  const { isCommentOpen, setIsCommentOpen, toggleComment } = useCommentStore();
  const router = useRouter();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);

  const [likes, setLikes] = useState(0);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const [commentCount, setCommentCount] = useState(0);
  const [imageHeight, setImageHeight] = useState<number>(393);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage('normal');
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

  useEffect(() => {
    if (!post?.photo) {
      setImageHeight(393);
      return;
    }

    const img = new Image();
    img.src = post.photo;

    img.onload = () => {
      const aspectRatio = img.height / img.width;

      const minHeight = 393;
      const maxHeight = 491;

      const calculatedHeight = 393 * aspectRatio;
      const finalHeight = Math.min(Math.max(calculatedHeight, minHeight), maxHeight);

      setImageHeight(finalHeight);
    }
  }, [post?.photo]);

  // 실시간 좋아요 구독
  useEffect(() => {
    if (!id || !user) return;

    // 실시간 리스너 등록
    const unsubscribe = subscribeLikes(
        id as string,
        user.uid,
        (data) => {
          setLikes(data.likes);
          setIsLikedByMe(data.isLikedByMe);
        }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, [id, user]);

  // 실시간 댓글 수 구독
  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeCommentCount(
        id as string,
        (count) => {
          setCommentCount(count);
        }
    );

    return () => {
      unsubscribe();
    };
  }, [id]);

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
      setIsToggling(true);
      await toggleLike(id as string, user.uid, user.displayName, user.photoURL);
    } catch (e) {
      console.error('Failed to toggle like:', e);
      alert('좋아요 처리에 실패했습니다.');
    } finally {
      setIsToggling(false);
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
        router.replace("/feed");
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
      <div className="flex h-screen">
        <div className={`flex flex-col transition-all duration-300
                         ${isCommentOpen ? 'w-1/2 hidden sm:flex' : 'w-full'}`}>
          <div className="flex px-[20px] py-[18px] items-center justify-between">
            <div className="flex flex-row gap-[10px]">
              {post.member.profilePhoto ? (
                  <div className="w-[52px] h-[52px] rounded-full overflow-hidden">
                    <img
                        src={post.member.profilePhoto}
                        alt={post.member.nickname}
                        className="w-full h-full object-cover"
                    />
                  </div>
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
              (post.member.memberId === user?.uid) ? (
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
                ) : (user &&
                    <ChatButton
                        otherUserId={post.member.memberId}
                        otherUserName={post.member.nickname}
                        otherUserPhoto={post.member.profilePhoto}
                    />
              )
            }
          </div>

          <div className="flex overflow-hidden">
            {post.photo ? (
                <img
                    src={post.photo}
                    alt="포스트 이미지"
                    className="w-full object-cover"
                    style={{ height: `${imageHeight}px` }}
                />
            ) : (
                <div className="w-full h-[393px] bg-light" />
            )}
          </div>

          <div className="flex items-center gap-[20px] pt-[10px] pl-[10px]">
            <button
                onClick={handleToggleLike}
                disabled={isToggling}
                className="flex items-center gap-[10px] text-base text-[14px]"
            >
              <img
                  src={isLikedByMe ? '/Heart-full.png' : '/Heart.png'}
                  alt="좋아요"
                  width={30}
                  height={30}
              />
              {likes}
            </button>

            <button
              onClick={toggleComment}
              className="flex items-center gap-[8px] text-base text-[14px]"
            >
              <img
                src="/Comment.png"
                alt="댓글"
                width={30}
                height={30}
              />
              <span>{commentCount}</span>
            </button>
          </div>

          <div className="text-[16px] p-[10px] whitespace-pre-line break-all">
            {post.post}
          </div>
        </div>

        {isCommentOpen && (
            <div className="w-full sm:w-1/2 border-l border-light flex flex-col h-screen">
              <div
                  className="flex items-center justify-between px-[20px] py-[16px] border-b border-light">
                <h2 className="text-[18px] font-bold">댓글 {commentCount}</h2>
                <button
                    onClick={() => setIsCommentOpen(false)}
                    className="p-[4px] hover:bg-snow rounded"
                >
                  <img src="/Close.png" alt="닫기" width={24} height={24}/>
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <CommentSection postId={id as string} postAuthorId={post.member.memberId as string} />
              </div>
            </div>
        )}
      </div>
  );
}