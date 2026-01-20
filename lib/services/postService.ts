// lib/services/postService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { PostDetail, PostSummary, TempRange, Gender } from '../../types';

export const getPosts = async (
    lastDoc?: DocumentSnapshot | null,
    pageSize: number = 12,
    filters?: {
      tempRanges?: TempRange[];
      genders?: Gender[];
      order?: 'latest' | 'popular';
    }
) => {
  try {
    const postsRef = collection(db, 'posts');
    let q = query(postsRef);

    // 필터 적용
    if (filters?.tempRanges && filters.tempRanges.length > 0) {
      q = query(q, where('tempRange', 'in', filters.tempRanges));
    }

    if (filters?.genders && filters.genders.length > 0) {
      q = query(q, where('gender', 'in', filters.genders));
    }

    // 정렬
    if (filters?.order === 'popular') {
      q = query(q, orderBy('likes', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    // 페이지네이션
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const posts: PostSummary[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PostSummary));

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error('피드를 불러오지 못했습니다.');
  }
};

export const getPostById = async (postId: string, userId?: string) => {
  try {
    const postDoc = await getDoc(doc(db, 'posts', postId));

    if (!postDoc.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }

    const postData = postDoc.data();
    const memberDoc = await getDoc(doc(db, 'users', postData.memberId));

    const isLikedByMe = userId
        ? (postData.likedBy || []).includes(userId)
        : false;

    const post: PostDetail = {
      id: postDoc.id,
      createdAt: postData.createdAt,
      photo: postData.photo,
      post: postData.post,
      tempRange: postData.tempRange,
      likes: postData.likes || 0,
      member: {
        memberId: memberDoc.id,
        nickname: memberDoc.data()?.nickname || '익명',
        profilePhoto: memberDoc.data()?.profilePhoto || '',
      },
      isLikedByMe,
    };

    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw new Error('게시글을 불러오지 못했습니다.');
  }
};

export const toggleLike = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }

    const likedBy = postDoc.data()?.likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
    } else {
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
    }

    const updatedDoc = await getDoc(postRef);
    return {
      likes: updatedDoc.data()?.likes || 0,
      isLikedByMe: !isLiked
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    throw new Error('좋아요 처리에 실패했습니다.');
  }
};