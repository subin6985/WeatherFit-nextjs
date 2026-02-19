import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
          { error: '이메일을 입력해주세요.' },
          { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'emailVerifications', email));

    return NextResponse.json({
      success: true,
      message: '인증이 초기화되었습니다.',
    });

  } catch (error) {
    console.error('인증 초기화 실패:', error);
    return NextResponse.json(
        { error: '인증 초기화에 실패했습니다.' },
        { status: 500 }
    );
  }
}