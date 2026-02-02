"use client";

import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { createReply, deleteComment } from '../../lib/services/commentService';
import { CommentWithReplies } from '../../types';

interface CommentItemProps {
  comment: CommentWithReplies;
  postId: string;
  onUpdate: () => void;
}

export default function CommentItem({ comment, postId, onUpdate }: CommentItemProps) {
  const { user } = useAuthStore();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleReplySubmit = async () => {
    if (!replyInput.trim() || !user) {
      alert('답댓글을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await createReply(
        postId,
        comment.id,
        user.uid,
        user.displayName || '익명',
        user.photoURL || '',
        replyInput
      );
      setReplyInput('');
      setShowReplyInput(false);
      await onUpdate();
    } catch (error) {
      console.error('답댓글 작성 실패:', error);
      alert('답댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(postId, comment.id, comment.depth === 0);
      await onUpdate();
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <div>
      {/* 원댓글 */}
      <div className="flex gap-[12px]">
        {comment.isDeleted ? (
            // 삭제된 댓글
            <div className="w-[36px] h-[36px] rounded-full bg-light" />
        ) : comment.userPhoto ? (
          <img
            src={comment.userPhoto}
            alt={comment.userName}
            className="w-[36px] h-[36px] rounded-full object-cover"
          />
        ) : (
          <div className="w-[36px] h-[36px] rounded-full bg-light" />
        )}

        <div className="flex-1">
          {comment.isDeleted ? (
            <div>
              <p className="text-[14px] text-middle italic">
                삭제된 댓글입니다.
              </p>
              {comment.replyCount > 0 && (
                  <span className="text-[12px] text-middle mt-[8px] block
                                   cursor-pointer hover:underline hover:brightness-75"
                        onClick={() => setIsReplyOpen(prev => !prev)}>
                    답글 {comment.replyCount}개
                  </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-[8px] mb-[4px]">
                <span className="text-[14px] font-bold">{comment.userName}</span>
                <span className="text-[12px] text-middle">
                  {formatDate(comment.createdAt)}
                </span>
              </div>

              <p className="text-[14px] text-base mb-[8px] whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              <div className="flex items-center gap-[16px] text-[12px]">
                {user && comment.depth === 0 && (
                  <button
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className="text-middle hover:underline hover:brightness-75"
                  >
                    답글 달기
                  </button>
                )}

                {comment.replyCount > 0 && (
                  <span className="text-middle cursor-pointer hover:underline hover:brightness-75"
                        onClick={() => setIsReplyOpen(prev => !prev)}>
                    답글 {comment.replyCount}개
                  </span>
                )}

                {user?.uid === comment.userId && (
                  <button
                    onClick={handleDelete}
                    className="text-warning hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
              </div>

              {/* 답글 입력 */}
              {showReplyInput && (
                <div className="mt-[12px] flex gap-[8px]">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="답글을 입력하세요"
                    className="flex-1 px-[8px] border border-light rounded-lg
                             focus:outline-none focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit()}
                  />
                  <button
                    onClick={handleReplySubmit}
                    disabled={!replyInput.trim() || submitting}
                    className="px-[12px] py-[8px] bg-primary text-white rounded-lg
                             disabled:bg-gray-300 text-[14px]"
                  >
                    {submitting ? '작성 중...' : '등록'}
                  </button>
                  <button
                    onClick={() => setShowReplyInput(false)}
                    className="px-[12px] py-[8px] border border-light rounded-lg text-[14px]"
                  >
                    취소
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 답댓글 목록 */}
      {(comment.replies.length > 0 && isReplyOpen) && (
        <div className="ml-[48px] mt-[12px] space-y-[12px]">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex gap-[12px]">
              {reply.userPhoto ? (
                <img
                  src={reply.userPhoto}
                  alt={reply.userName}
                  className="w-[32px] h-[32px] rounded-full object-cover"
                />
              ) : (
                <div className="w-[32px] h-[32px] rounded-full bg-light" />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-[8px] mb-[4px]">
                  <span className="text-[13px] font-bold">{reply.userName}</span>
                  <span className="text-[11px] text-middle">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>

                <p className="text-[13px] text-base mb-[4px] whitespace-pre-wrap break-words">
                  {reply.content}
                </p>

                {user?.uid === reply.userId && (
                  <button
                    onClick={async () => {
                      if (!confirm('답댓글을 삭제하시겠습니까?')) return;
                      await deleteComment(postId, reply.id, false);
                      await onUpdate();
                    }}
                    className="text-[11px] text-warning hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}