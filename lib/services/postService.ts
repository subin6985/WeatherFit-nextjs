import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  where,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  DocumentSnapshot,
  deleteDoc
} from 'firebase/firestore';
import {auth, db, storage} from '../firebase';
import { PostDetail, PostSummary, TempRange, Gender } from '../../types';
import {ref, uploadBytes, getDownloadURL, deleteObject} from 'firebase/storage';
import {createNotification} from "./notificationService";
import {analyzeClothing} from "./aiClothingService";
import {updateClothingStats} from "./clothingStatsService";

export interface CreatePostData {
  file: File;
  content: string;
  temp: number;
  tempRange: TempRange;
  region: string;
  outfitDate: Date;
  userId: string;
  gender: string;
}

export interface UpdatePostData {
  content: string;
  temp: number;
  tempRange: TempRange;
  region: string;
  outfitDate: Date;
}

export const createPost = async (data: CreatePostData): Promise<string> => {
  try {
    const { file, content, temp, tempRange, region, outfitDate, userId, gender } = data;

    console.log('1. 이미지 업로드 시작...');
    const storageRef = ref(storage, `posts/${userId}/${Date.now()}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);
    console.log('2. 이미지 업로드 완료:', photoURL);

    // AI로 옷 분석
    console.log('3. AI 분석 시작...');
    const aiAnalysis = await analyzeClothing(photoURL);
    console.log('4. AI 분석 결과:', aiAnalysis);

    // 분석 실패 시 에러
    if (!aiAnalysis.top || !aiAnalysis.bottom || aiAnalysis.confidence < 0.6) {
      await deleteObject(storageRef);
      throw new Error('이미지에서 옷을 인식할 수 없습니다.');
    }

    console.log('5. Firestore에 게시글 생성 시작...');
    const postsRef = collection(db, "posts");
    const docRef = await addDoc(postsRef, {
      memberId: userId,
      post: content,
      photo: photoURL,
      temp,
      tempRange,
      region,
      outfitDate: outfitDate.toISOString(),
      gender,
      likes: 0,
      likedBy: [],
      createdAt: Date.now(),
      aiAnalysis,
    });
    console.log('6. 게시글 생성 완료:', docRef.id);

    // 통계 업데이트
    console.log('7. 통계 업데이트 시작...');
    await updateClothingStats(tempRange, gender, aiAnalysis, 'add');
    console.log('8. 통계 업데이트 완료');

    return docRef.id;
  } catch (error) {
    console.error("게시글 작성 실패:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
};

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
    const posts: PostSummary[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: data.createdAt,
        photo: data.photo,
        temp: data.temp,
        tempRange: data.tempRange,
        region: data.region,
        outfitDate: data.outfitDate,
        likes: data.likes || 0,
        gender: data.gender,
      } as PostSummary;
    });

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
      temp: postData.temp,
      tempRange: postData.tempRange,
      region: postData.region,
      outfitDate: postData.outfitDate,
      likes: postData.likes || 0,
      member: {
        memberId: memberDoc.id,
        nickname: memberDoc.data()?.nickname || '탈퇴한 회원',
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

// 실시간 좋아요 구독
export const subscribeLikes = (
    postId: string,
    userId: string,
    callback: (data: { likes: number; isLikedByMe: boolean }) => void
) => {
  const postRef = doc(db, 'posts', postId);

  // 실시간 리스너 등록
  const unsubscribe = onSnapshot(postRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const isLikedByMe = data.likedBy?.includes(userId) || false;

      callback({
        likes: data.likes || 0,
        isLikedByMe
      })
    }
  });

  // 구독 해제 함수 반환
  return unsubscribe;
};

export const toggleLike = async (
    postId: string,
    userId: string,
    userName: string,
    userPhoto: string
) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }

    const postData = postDoc.data();
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

      // 좋아요 알림 생성
      await createNotification({
        recipientId: postData.memberId,
        senderId: userId,
        senderName: userName,
        senderPhoto: userPhoto,
        type: 'like',
        postId,
        message: `${userName}님이 회원님의 게시물을 좋아합니다.`,
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

export const updatePost = async (postId: string, data: UpdatePostData) => {
  try {
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);
    const oldData = postDoc.data();

    // 온도 범위 변경 시
    if (oldData.tempRange !== data.tempRange && oldData.aiAnalysis) {
      await updateClothingStats(
          oldData.tempRange,
          oldData.gender,
          oldData.aiAnalysis,
          'remove'
      );

      await updateClothingStats(
          data.tempRange,
          oldData.gender,
          oldData.aiAnalysis,
          'add'
      );
    }

    await updateDoc(postRef, {
      post: data.content,
      temp: data.temp,
      tempRange: data.tempRange,
      region: data.region,
      outfitDate: data.outfitDate.toISOString(),
    })
  } catch (err) {
    console.log("게시물 수정 실패:", err);
  }
}

export const deletePost = async (postId: string, userId: string) => {
  try {
    const postDoc = await getDoc(doc(db, 'posts', postId));
    const postData = postDoc.data();

    if (!postData) throw new Error('게시물을 찾을 수 없습니다.');

    // 통계에서 제거
    await updateClothingStats(
        postData.tempRange,
        postData.gender,
        postData.aiAnalysis,
        'remove'
    );

    // 문서 삭제
    await deleteDoc(doc(db, "posts", postId));

    // 이미지 삭제
    const photoRef = ref(storage, postData.photo);
    await deleteObject(photoRef);

    return true;
  } catch(e) {
    console.log(e);
    throw e;
  }
}

// 내가 좋아요 한 게시물 가져오기
export const getLikedPosts = async (
    userId: string,
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

    q = query(q, where('likedBy', 'array-contains', userId));

    if (filters?.tempRanges && filters.tempRanges.length > 0) {
      q = query(q, where('tempRange', 'in', filters.tempRanges));
    }

    if (filters?.genders && filters.genders.length > 0) {
      q = query(q, where('gender', 'in', filters.genders));
    }

    if (filters?.order === 'popular') {
      q = query(q, orderBy('likes', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const posts: PostSummary[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: data.createdAt,
        photo: data.photo,
        temp: data.temp,
        tempRange: data.tempRange,
        region: data.region,
        outfitDate: data.outfitDate,
        likes: data.likes || 0,
        gender: data.gender,
      } as PostSummary;
    });

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw new Error("좋아요 한 게시물을 불러오지 못했습니다.");
  }
};

// 내가 작성한 게시물 가져오기
export const getMyPosts = async (
    userId: string,
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

    q = query(q, where('memberId', '==', userId));

    if (filters?.tempRanges && filters.tempRanges.length > 0) {
      q = query(q, where('tempRange', 'in', filters.tempRanges));
    }

    if (filters?.genders && filters.genders.length > 0) {
      q = query(q, where('gender', 'in', filters.genders));
    }

    if (filters?.order === 'popular') {
      q = query(q, orderBy('likes', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const posts: PostSummary[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: data.createdAt,
        photo: data.photo,
        temp: data.temp,
        tempRange: data.tempRange,
        region: data.region,
        outfitDate: data.outfitDate,
        likes: data.likes || 0,
        gender: data.gender,
      } as PostSummary;
    });

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw new Error("내가 작성한 게시물을 불러오지 못했습니다.");
  }
};