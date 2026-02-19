import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
          { error: '이메일과 코드를 입력해주세요.' },
          { status: 400 }
      );
    }

    // Firestore에서 인증 데이터 가져오기
    const docRef = doc(db, 'emailVerifications', email);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
          { error: '인증 요청을 찾을 수 없습니다.' },
          { status: 404 }
      );
    }

    const data = docSnap.data();

    // 만료 확인
    if (data.expiresAt.toDate() < new Date()) {
      return NextResponse.json(
          { error: '인증 코드가 만료되었습니다.' },
          { status: 400 }
      );
    }

    // 코드 일치 확인
    if (data.code !== code) {
      return NextResponse.json(
          { error: '인증 코드가 일치하지 않습니다.' },
          { status: 400 }
      );
    }

    // 인증 완료 표시
    await updateDoc(docRef, { verified: true });

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.',
    });

  } catch (error) {
    console.error('코드 검증 실패:', error);
    return NextResponse.json(
        { error: '코드 검증에 실패했습니다.' },
        { status: 500 }
    );
  }
}