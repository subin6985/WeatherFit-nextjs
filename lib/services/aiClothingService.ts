export type TopType = '민소매' | '반소매' | '긴소매' | '아우터';
export type BottomType = '반바지' | '긴바지' | '짧은 치마' | '긴 치마';

export interface ClothingAnalysis {
  top: TopType | null;
  bottom: BottomType | null;
  confidence: number;
}

// 이미지에서 옷 분류
export const analyzeClothing = async (imageUrl: string): Promise<ClothingAnalysis> => {
  try {
    console.log('API 호출 시작:', imageUrl);

    // API 호출
    const response = await fetch('/api/analyze-clothing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    console.log('API 응답 상태:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('API 에러 응답:', error);
      throw new Error(error.error || 'AI 분석에 실패했습니다.');
    }

    const result = await response.json();
    console.log('AI 분석 성공:', result);

    return result;
  } catch (error) {
    console.error('AI 분석 살패:', error);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('AI 분석에 실패했습니다.');
  }
};

// 상의 분류
function classifyTop(labels: any[], objects: any[]): TopType | null {
  const keywords = labels.map(l => l.description.toLowerCase());

  // 아우터 (겉옷)
  if (keywords.some(k =>
    ['jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'sweater'].includes(k)
  )) {
    return '아우터';
  }

  // 민소매
  if (keywords.some(k =>
    ['sleeveless', 'tank top', 'vest'].includes(k)
  )) {
    return '민소매';
  }

  // 긴소매
  if (keywords.some(k =>
      ['hoodie', 'sweater', 'long sleeve', 'long-sleeved'].includes(k)
  )) {
    return '긴소매';
  }

  // 반소매 (기본값)
  if (keywords.some(k =>
      ['t-shirt', 'shirt', 'top', 'blouse', 'short sleeve'].includes(k)
  )) {
    return '반소매';
  }

  return null;
}

// 하의 분류
function classifyBottom(labels: any[], objects: any[]): BottomType | null {
  const keywords = labels.map(l => l.description.toLowerCase());

  // 반바지
  if (keywords.some(k =>
    ['shorts', 'short pants'].includes(k)
  )) {
    return '반바지';
  }

  // 긴바지
  if (keywords.some(k =>
      ['pants', 'jeans', 'trousers', 'long pants'].includes(k)
  )) {
    return '긴바지';
  }

  // 짧은 치마
  if (keywords.some(k =>
      ['mini skirt', 'short skirt'].includes(k)
  )) {
    return '짧은 치마';
  }

  // 긴 치마
  if (keywords.some(k =>
      ['skirt', 'long skirt', 'maxi skirt'].includes(k)
  )) {
    return '긴 치마';
  }

  return null;
}

// 신뢰도 계산
function calculateConfidence(labels: any[]): number {
  if (labels.length === 0) return 0;
  const avgScore = labels.slice(0, 5).reduce((sum, l) => sum + (l.score || 0), 0) / 5;
  return avgScore;
}