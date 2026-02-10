import {Gender, TempRange} from "../../types";
import {ClothingAnalysis} from "./aiClothingService";
import {db} from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs, increment,
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

  const increment_val = action === 'add' ? 1 : -1;
  const genderKey = gender === 'FEMALE' ? 'female' : gender === 'MALE' ? 'male' : 'all';

  // remove 시 음수 방지
  if (action === 'remove') {
    const currentStats = statsDoc.data();
    const currentTopCount = currentStats?.[genderKey]?.top?.[aiAnalysis.top] || 0;
    const currentBottomCount = currentStats?.[genderKey]?.bottom?.[aiAnalysis.bottom] || 0;
    const currentAllTopCount = currentStats?.all?.top?.[aiAnalysis.top] || 0;
    const currentAllBottomCount = currentStats?.all?.bottom?.[aiAnalysis.bottom] || 0;

    // 이미 0이면 감소하지 않음
    if (currentTopCount === 0 || currentBottomCount === 0 ||
        currentAllTopCount === 0 || currentAllBottomCount === 0) {
      console.warn('통계가 이미 0입니다. 감소하지 않습니다.');
      return;
    }
  }

  await updateDoc(statsRef, {
    // 전체 통계
    [`all.top.${aiAnalysis.top}`]: increment(increment_val),
    [`all.bottom.${aiAnalysis.bottom}`]: increment(increment_val),

    // 성별 통계
    [`${genderKey}.top.${aiAnalysis.top}`]: increment(increment_val),
    [`${genderKey}.bottom.${aiAnalysis.bottom}`]: increment(increment_val),
  });
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
  const topTotal = Object.values(data.top).reduce((sum: number, val: any) => sum + val, 0);
  const bottomTotal = Object.values(data.bottom).reduce((sum: number, val: any) => sum + val, 0);

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
export const recalculateStats = async (userId: string, newGender: Gender) => {
  try {
    const postQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId)
    );
    const postSnapshot = await getDocs(postQuery);

    for (const postDoc of postSnapshot.docs) {
      const postData = postDoc.data();

      if (!postData.aiAnalysis) continue;

      // 이전 성별을 통계에서 제거
      await updateClothingStats(
          postData.tempRange,
          postData.gender, // 업데이트 이전 성별
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