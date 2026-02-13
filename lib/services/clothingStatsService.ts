import {Gender, TempRange} from "../../types";
import {ClothingAnalysis} from "./aiClothingService";
import {db} from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs, increment, onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import {RatioResponse} from "../../components/Ratio";

export const updateClothingStats = async (
    tempRange: TempRange,
    gender: string,
    aiAnalysis: ClothingAnalysis,
    action: 'add' | 'remove'
) => {
  const statsRef = doc(db, 'clothingStats', tempRange);
  const statsDoc = await getDoc(statsRef);

  // 문서가 없으면 생성
  if (!statsDoc.exists()) {
    await setDoc(statsRef, {
      all: {
        top: { '민소매': 0, '반소매': 0, '긴소매': 0, '아우터': 0 },
        bottom: { '반바지': 0, '긴바지': 0, '짧은 치마': 0, '긴 치마': 0 }
      },
      female: {
        top: { '민소매': 0, '반소매': 0, '긴소매': 0, '아우터': 0 },
        bottom: { '반바지': 0, '긴바지': 0, '짧은 치마': 0, '긴 치마': 0 }
      },
      male: {
        top: { '민소매': 0, '반소매': 0, '긴소매': 0, '아우터': 0 },
        bottom: { '반바지': 0, '긴바지': 0, '짧은 치마': 0, '긴 치마': 0 }
      }
    });
  }

  const genderKey = gender === 'FEMALE' ? 'female' : gender === 'MALE' ? 'male' : 'all';

  // remove 시 음수 방지
  if (action === 'remove') {
    const currentStats = statsDoc.data();

    // 업데이트 할 필드 (기존에 0이 아닌 필드)
    const updateData: any = {};

    const currentAllTopCount = currentStats.all?.top?.[aiAnalysis.top] || 0;
    if (currentAllTopCount > 0) {
      updateData[`all.top.${aiAnalysis.top}`] = increment(-1);
    } else {
      console.warn(`all.top.${aiAnalysis.top}가 이미 0입니다.`);
    }

    const currentAllBottomCount = currentStats?.all?.bottom?.[aiAnalysis.bottom] || 0;
    if (currentAllBottomCount > 0) {
      updateData[`all.bottom.${aiAnalysis.bottom}`] = increment(-1);
    } else {
      console.warn(`all.bottom.${aiAnalysis.bottom}가 이미 0입니다.`);
    }

    const currentTopCount = currentStats?.[genderKey]?.top?.[aiAnalysis.top] || 0;
    if (currentTopCount > 0) {
      updateData[`${genderKey}.top.${aiAnalysis.top}`] = increment(-1);
    } else {
      console.warn(`${genderKey}.top.${aiAnalysis.top}가 이미 0입니다.`);
    }

    const currentBottomCount = currentStats?.[genderKey]?.bottom?.[aiAnalysis.bottom] || 0;
    if (currentBottomCount > 0) {
      updateData[`${genderKey}.bottom.${aiAnalysis.bottom}`] = increment(-1);
    } else {
      console.warn(`${genderKey}.bottom.${aiAnalysis.bottom}가 이미 0입니다.`);
    }

    if (Object.keys(updateData).length > 0) {
      await updateDoc(statsRef, updateData);
      console.log('통계 감소 완료:', updateData);
    } else {
      console.warn('모든 필드가 이미 0이어서 통계 업데이트 건너뜀');
    }
  } else {
    // add
    await updateDoc(statsRef, {
      // 전체 통계
      [`all.top.${aiAnalysis.top}`]: increment(1),
      [`all.bottom.${aiAnalysis.bottom}`]: increment(1),

      // 성별 통계
      [`${genderKey}.top.${aiAnalysis.top}`]: increment(1),
      [`${genderKey}.bottom.${aiAnalysis.bottom}`]: increment(1),
    });
    console.log('통계 증가 완료');
  }
};

// 통계 가져오기
export const getClothingStats = async (
    tempRange: TempRange,
    gender: 'all' | 'female' | 'male'
): Promise<RatioResponse> => {
  const statsRef = doc(db, 'clothingStats', tempRange);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    return { top: [], bottom: [] };
  }

  const data = statsDoc.data()?.[gender];

  if (!data) {
    return { top: [], bottom: [] };
  }

  // 비율 계산
  const topTotal: any = Object.values(data.top).reduce((sum: number, val: any) => sum + val, 0);
  const bottomTotal: any = Object.values(data.bottom).reduce((sum: number, val: any) => sum + val, 0);

  // 합계가 0이면 빈 데이터 반환
  if (topTotal === 0 || bottomTotal === 0) {
    return {
      top: [],
      bottom: []
    };
  }

  const top = Object.entries(data.top)
  .filter(([_, count]: any) => count > 0) // 0인 항목 제외
  .map(([category, count]: any) => ({
    category,
    ratio: count / topTotal
  }));

  const bottom = Object.entries(data.bottom)
  .filter(([_, count]: any) => count > 0)
  .map(([category, count]: any) => ({
    category,
    ratio: count / bottomTotal
  }));

  return { top, bottom };
}

// 사용자 성별 변경 시 통계 재계산
export const recalculateStats = async (userId: string, oldGender: string, newGender: string) => {
  try {
    const postQuery = query(
        collection(db, 'posts'),
        where('memberId', '==', userId)
    );
    const postSnapshot = await getDocs(postQuery);

    for (const postDoc of postSnapshot.docs) {
      const postData = postDoc.data();

      if (!postData.aiAnalysis) continue;

      // 이전 성별을 통계에서 제거
      await updateClothingStats(
          postData.tempRange,
          oldGender,
          postData.aiAnalysis,
          'remove'
      );

      // 새 성별을 통계에 추가
      await updateClothingStats(
          postData.tempRange,
          newGender,
          postData.aiAnalysis,
          'add'
      );
    }

    console.log('통계 재계산 완료');
  } catch (error) {
    console.error('통계 재계산 실패:', error);
    throw error;
  }
}

// 실시간 구독 함수
export const subscribeClothingStats = (
    tempRange: TempRange,
    gender: 'all' | 'female' | 'male',
    callback: (stats: RatioResponse) => void
) => {
  const statsRef = doc(db, 'clothingStats', tempRange);

  return onSnapshot(statsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback({ top: [], bottom: [] });
      return;
    }

    const data = snapshot.data()?.[gender];

    if (!data) {
      callback({ top: [], bottom: [] });
      return;
    }

    const topTotal: any = Object.values(data.top).reduce((sum: number, val: any) => sum + val, 0);
    const bottomTotal: any = Object.values(data.bottom).reduce((sum: number, val: any) => sum + val, 0);

    if (topTotal === 0 || bottomTotal === 0) {
      callback({ top: [], bottom: [] });
      return;
    }

    const top = Object.entries(data.top)
        .filter(([_, count]: any) => count > 0)
        .map(([category, count]: any) => ({
          category,
          ratio: count / topTotal
        }));

    const bottom = Object.entries(data.bottom)
        .filter(([_, count]: any) => count > 0)
        .map(([category, count]: any) => ({
          category,
          ratio: count / bottomTotal
        }));

    callback({ top, bottom });
  })
}