import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateVerificationCode } from '../../../lib/email';
import { db } from '../../../lib/firebase';
import {collection, doc, getDocs, query, setDoc, Timestamp, where} from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // 이메일 유효성 검사
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
          { error: '유효하지 않은 이메일입니다.' },
          { status: 400 }
      );
    }

    // 이메일 중복 체크
    const userSnapshot = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
    );

    if (!userSnapshot.empty) {
      return NextResponse.json(
          { error: '이미 가입된 이메일입니다.' },
          { status: 409 }
      );
    }

    // 인증 코드 생성
    const code = generateVerificationCode();
    const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 5 * 60 * 1000) // 5분
    );

    // Firestore에 저장
    await setDoc(doc(db, 'emailVerifications', email), {
      code,
      email,
      expiresAt,
      verified: false,
      createdAt: Timestamp.now(),
    });

    // 이메일 HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>이메일 인증 코드</h2>
        <p>WeatherFit 가입을 위한 인증 코드입니다.</p>
        <div style="background-color: #f5f5f5; padding: 15px;
          border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 32px;
            letter-spacing: 4px; text-align: center;">${code}</h1>
        </div>
        <p style="color: #666;">이 코드는 5분 후 만료됩니다.</p>
      </div>
    `;

    // Gmail SMTP로 이메일 전송
    await sendEmail(email, 'WeatherFit 이메일 인증 코드', htmlContent);

    return NextResponse.json({
      success: true,
      message: '인증 코드가 전송되었습니다.',
    });

  } catch (error) {
    console.error('인증 코드 전송 실패:', error);
    return NextResponse.json(
        { error: '이메일 전송에 실패했습니다.' },
        { status: 500 }
    );
  }
}