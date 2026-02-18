import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// 서버사이드에서만 실행됨
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!);
const client = new vision.ImageAnnotatorClient({ credentials });

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
          { error: '이미지 URL이 필요합니다.' },
          { status: 400 }
      );
    }

    // Vision API 호출
    console.log('Vision API 호출 시작:', imageUrl);
    const [labelResult] = await client.labelDetection(imageUrl);
    const labels = labelResult.labelAnnotations || [];

    const [objectResult] = await client.objectLocalization(imageUrl);
    const objects = objectResult.localizedObjectAnnotations || [];

    console.log('Vision API 결과 - Labels:', labels.slice(0, 5).map(l => l.description));
    console.log('Vision API 결과 - Objects:', objects.slice(0, 5).map(o => o.name));

    // 옷 분류
    const analysis = classifyClothing(labels, objects);
    console.log('분류 결과:', analysis);

    if (!analysis.top || !analysis.bottom) {
      console.error('분류 실패 - top:', analysis.top, 'bottom:', analysis.bottom);
      return NextResponse.json(
          { error: '이미지에서 옷을 인식할 수 없습니다.' },
          { status: 400 }
      );
    }

    if (analysis.confidence < 0.6) {
      console.error('신뢰도 낮음:', analysis.confidence);
      return NextResponse.json(
          { error: '이미지가 명확하지 않습니다.' },
          { status: 400 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI 분석 실패:', error);
    return NextResponse.json(
        { error: 'AI 분석에 실패했습니다.' },
        { status: 500 }
    );
  }
}

// 분류 함수들
type TopType = '민소매' | '반소매' | '긴소매' | '아우터';
type BottomType = '반바지' | '긴바지' | '짧은 치마' | '긴 치마';

interface ClothingAnalysis {
  top: TopType | null;
  bottom: BottomType | null;
  confidence: number;
}

function classifyClothing(labels: any[], objects: any[]): ClothingAnalysis {
  const top = classifyTop(labels, objects);
  const bottom = classifyBottom(labels, objects);
  const confidence = calculateConfidence(labels);

  return { top, bottom, confidence };
}

function classifyTop(labels: any[], objects: any[]): TopType | null {
  const keywords = labels.map(l => l.description.toLowerCase());
  const objectNames = objects.map(o => o.name.toLowerCase());
  const allKeyWords = [...keywords, ...objectNames];

  console.log('Top 분류 키워드:', allKeyWords);

  if (allKeyWords.some(k =>
      k.includes('jacket') || k.includes('coat') || k.includes('blazer') ||
      k.includes('cardigan') || k.includes('outerwear')
  )) {
    return '아우터';
  }

  if (allKeyWords.some(k =>
      k.includes('sleeveless') || k.includes('tank') || k.includes('vest') ||
      k.includes('camisole')
  )) {
    return '민소매';
  }

  if (allKeyWords.some(k =>
      k.includes('long sleeve') || k.includes('long-sleeve') || k.includes('longsleeve') ||
      k.includes('hoodie') || k.includes('sweater')
  )) {
    return '긴소매';
  }

  if (allKeyWords.some(k =>
      k.includes('shirt') || k.includes('t-shirt') || k.includes('tee') ||
      k.includes('top') || k.includes('blouse') || k.includes('clothing') ||
      k.includes('sleeve')
  )) {
    return '반소매';
  }

  return null;
}

function classifyBottom(labels: any[], objects: any[]): BottomType | null {
  const keywords = labels.map(l => l.description.toLowerCase());
  const objectNames = objects.map(o => o.name.toLowerCase());
  const allKeyWords = [...keywords, ...objectNames];

  console.log('Bottom 분류 키워드:', allKeyWords);

  if (allKeyWords.some(k =>
      k.includes('shorts') || k.includes('short pant')
  )) {
    return '반바지';
  }

  if (allKeyWords.some(k =>
      k.includes('pants') || k.includes('trousers') || k.includes('jeans') ||
      k.includes('denim') || k.includes('bottoms')
  )) {
    return '긴바지';
  }

  if (allKeyWords.some(k =>
      k.includes('skirt') || k.includes('mini') || k.includes('short') ||
      k.includes('short skirt')
  )) {
    return '짧은 치마';
  }

  if (keywords.some(k =>
      k.includes('skirt') || k.includes('maxi') || k.includes('long skirt')
  )) {
    return '긴 치마';
  }

  return null;
}

function calculateConfidence(labels: any[]): number {
  if (labels.length === 0) return 0;
  const avgScore = labels.slice(0, 5).reduce((sum, l) => sum + (l.score || 0), 0) / 5;
  console.log('신뢰도 계산:', avgScore);
  return avgScore;
}