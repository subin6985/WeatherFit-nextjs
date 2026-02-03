import {
  collection,
  doc, addDoc, getDoc, getDocs, deleteDoc, updateDoc,
  query, where, orderBy, increment, writeBatch, onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Comment, CommentWithReplies } from "../../types";
import {createNotification} from "./notificationService";

// 원댓글 작성
export const createComment = async (
    postId: string,
    userId: string,
    userName: string,
    userPhoto: string,
    content: string,
    postAuthorId: string
): Promise<string> => {
  const commentsRef = collection(db, 'posts', postId, 'comments');

  const docRef = await addDoc(commentsRef, {
    postId,
    userId,
    userName,
    userPhoto,
    content,
    parentId: null,
    depth: 0,
    replyCount: 0,
    isDeleted: false,
    createdAt: Date.now(),
  });

  await createNotification({
    recipientId: postAuthorId,
    senderId: userId,
    senderName: userName,
    senderPhoto: userPhoto,
    type: 'comment',
    postId,
    commentId: docRef.id,
    message: `${userName}님이 댓글을 남겼습니다: ${content.slice(0, 20)}${content.length > 20 ? '...' : ''}`,
  })

  return docRef.id;
}

// 답댓글 작성
export const createReply = async (
    postId: string,
    parentId: string,
    userId: string,
    userName: string,
    userPhoto: string,
    content: string,
    parentAuthorId: string
): Promise<string> => {
  const commentsRef = collection(db, 'posts', postId, 'comments');

  const docRef = await addDoc(commentsRef, {
    postId,
    userId,
    userName,
    userPhoto,
    content,
    parentId,
    depth: 1,
    replyCount: 0,  // 답댓글에는 답글 불가
    isDeleted: false,
    createdAt: Date.now(),
  });

  // 원댓글의 replyCount 증가
  const parentRef = doc(db, 'posts', postId, 'comments', parentId);
  await updateDoc(parentRef, {
    replyCount: increment(1)
  });

  await createNotification({
    recipientId: parentAuthorId,
    senderId: userId,
    senderName: userName,
    senderPhoto: userPhoto,
    type: 'reply',
    postId,
    commentId: docRef.id,
    message: `${userName}님이 답글을 남겼습니다: ${content.slice(0, 20)}${content.length > 20 ? '...' : ''}`
  });

  return docRef.id;
};

// 댓글 목록 가져오기 (계층 구조로)
export const getComments = async (postId: string): Promise<CommentWithReplies[]> => {
  const commentsRef = collection(db, 'posts', postId, 'comments');

  // 모든 댓글 가져오기
  const q = query(commentsRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  const allComments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Comment));

  // 원댓글만 필터링
  const parentComments = allComments.filter(c => c.depth === 0);

  // 각 원댓글에 답댓글 연결
  const commentsWithReplies: CommentWithReplies[] = parentComments.map(parent => ({
    ...parent,
    replies: allComments
      .filter(c => c.parentId === parent.id)
      .sort((a, b) => a.createdAt - b.createdAt)
  }));

  return commentsWithReplies;
}

// 댓글 삭제
export const deleteComment = async (
    postId: string,
    commentId: string,
    isParent: boolean
) => {
  const commentRef = doc(db, 'posts', postId, 'comments', commentId);

  if (isParent) {
    // 원댓글 삭제
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }

    const replyCount = commentDoc.data().replyCount || 0;

    if (replyCount === 0) {
      // 답댓글이 없으면 완전 삭제
      await deleteDoc(commentRef);
    } else {
      // 있으면 '삭제된 댓글입니다'로 변경
      await updateDoc(commentRef, {
        isDeleted: true,
        deletedAt: Date.now(),
        content: '삭제된 댓글입니다.',
        userName: "",
        userPhoto: "",
      });
    }
  } else {
    // 답댓글 삭제 시 원댓글의 replyCount 감소
    const commentDoc = await getDoc(doc(db, 'posts', postId, 'comments', commentId));
    const commentData = commentDoc.data();

    if (commentData?.parentId) {
      const parentRef = doc(db, 'posts', postId, 'comments', commentData.parentId);
      await updateDoc(parentRef, {
        replyCount: increment(-1)
      });

      const parentDoc = await getDoc(parentRef);

      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        const newReplyCount = parentData.replyCount || 0;

        // 원댓글이 삭제되고 답댓글이 0개가 되면, 원댓글도 완전 삭제
        if (parentData.isDeleted && newReplyCount === 0) {
          await deleteDoc(parentRef);
        }
      }
    }

    await deleteDoc(commentRef);
  }
};

// 특정 사용자의 댓글을 모두 삭제
export const deleteUserComments = async (userId: string) => {
  const postsRef = collection(db, 'posts');
  const postSnapshot = await getDocs(postsRef);

  for (const postDoc of postSnapshot.docs) {
    const postId = postDoc.id;
    const commentsRef = collection(db, 'posts', postId, 'comments');

    const userCommentsQuery = query(
        commentsRef,
        where('userId', '==', userId)
    );
    const userCommentsSnapshot = await getDocs(userCommentsQuery);

    // 원댓글과 답댓글 분리
    const parentCommentsToDelete: any[] = [];
    const replyCommentsToDelete: any[] = [];

    userCommentsSnapshot.docs.forEach(commentDoc => {
      const commentData = commentDoc.data();

      if (commentData.depth === 0) {
        parentCommentsToDelete.push({ id: commentDoc.id, data: commentData });
      } else {
        replyCommentsToDelete.push({ id: commentDoc.id, data: commentData });
      }
    })

    const batch = writeBatch(db);
    const replyCountUpdates: { [parentId: string]: number } = {};

    // 답댓글 먼저 처리
    replyCommentsToDelete.forEach(reply => {
      const commentRef = doc(db, 'posts', postId, 'comments', reply.id);
      batch.delete(commentRef);

      if (reply.data.parentId) {
        replyCountUpdates[reply.data.parentId] =
            (replyCountUpdates[reply.data.parentId] || 0) - 1;
      }
    });

    // 원댓글 처리
    parentCommentsToDelete.forEach(parent => {
      const commentRef = doc(db, 'posts', postId, 'comments', parent.id);
      const currentReplyCount = parent.data.replyCount || 0;
      const decreaseAmount = replyCountUpdates[parent.id] || 0;
      const newReplyCount = currentReplyCount + decreaseAmount;

      if (newReplyCount === 0) {
        // 답댓글이 없으면 완전 삭제
        batch.delete(commentRef);
      } else {
        // 답댓글이 있으면 소프트 삭제
        batch.update(commentRef, {
          isDeleted: true,
          deletedAt: Date.now(),
          content: '삭제된 댓글입니다.',
          userName: "",
          userPhoto: "",
          replyCount: newReplyCount,
        })
      }
    })

    // 다른 사람의 원댓글 replyCount 업데이트
    Object.entries(replyCountUpdates).forEach(([parentId, decrement]) => {
      // 자신의 원댓글은 이미 위에서 처리했으므로 제외
      const isOwnComment = parentCommentsToDelete.some(p => p.id === parentId);

      if (!isOwnComment) {
        const parentRef = doc(db, 'posts', postId, 'comments', parentId);
        batch.update(parentRef, {
          replyCount: increment(decrement)
        });
      }
    });

    await batch.commit();

    // 삭제된 원댓글 중 답댓글이 0개가 된 것들 완전 삭제
    for (const [parentId, decrement] of Object.entries(replyCountUpdates)) {
      const isOwnComment = parentCommentsToDelete.some(p => p.id === parentId);

      if (!isOwnComment) {
        const parentRef = doc(db, 'posts', postId, 'comments', parentId);
        const parentDoc = await getDoc(parentRef);

        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          const newReplyCount = (parentData.replyCount || 0);

          // 삭제된 댓글이고 답댓글이 0개면 완전 삭제
          if (parentData.isDeleted && newReplyCount === 0) {
            await deleteDoc(parentRef);
          }
        }
      }
    }
  }
}

// 댓글 수 가져오기
export const getCommentCount = async (postId: string): Promise<number> => {
  const commentsRef = collection(db, 'posts', postId, 'comments');
  const snapshot = await getDocs(commentsRef);
  return snapshot.size;
};

// 실시간 댓글 수 구독
export const subscribeCommentCount = (
    postId: string,
    callback: (count: number) => void
) => {
  const commentsRef = collection(db, 'posts', postId, 'comments');

  return onSnapshot(commentsRef, (snapshot) => {
    callback(snapshot.size);
  });
};