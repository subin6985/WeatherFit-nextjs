"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { getComments, createComment } from '../../lib/services/commentService';
import { CommentWithReplies } from '../../types';
import CommentItem from './CommentItem';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
}

export default function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('댓글 불러오기 실패:', error);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !user) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await createComment(
          postId,
          user.uid,
          user.displayName || '익명',
          user.photoURL || '',
          input,
          postAuthorId
      );
      setInput('');
      await fetchComments();
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="p-[10px]">
        {/* 댓글 목록 */}
        <div className="mb-[20px]">
          {comments.length === 0 ? (
              <p className="text-middle text-center py-[40px]">
                첫 댓글을 남겨보세요!
              </p>
          ) : (
              <div className="space-y-[16px]">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        onUpdate={fetchComments}
                    />
                ))}
              </div>
          )}
        </div>

        {/* 댓글 입력 */}
        {user && (
            <div className="flex gap-[12px] items-start border-t border-light pt-[16px]">
              {user.photoURL ? (
                  <img
                      src={user.photoURL}
                      alt={user.displayName || '프로필'}
                      className="w-[36px] h-[36px] rounded-full object-cover"
                  />
              ) : (
                  <div className="w-[36px] h-[36px] rounded-full bg-light" />
              )}

              <div className="flex-1">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="w-full px-3 py-2 border border-light rounded-lg
                       resize-none focus:outline-none focus:border-primary"
                rows={2}
            />
                <div className="flex justify-end mt-[8px]">
                  <button
                      onClick={handleSubmit}
                      disabled={!input.trim() || loading}
                      className="px-[16px] py-[8px] bg-primary text-white rounded-lg
                         disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? '작성 중...' : '댓글 달기'}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}