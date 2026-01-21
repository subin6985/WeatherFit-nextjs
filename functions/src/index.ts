import * as admin from "firebase-admin";
import {Resend} from "resend";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();

// Secret으로 정의
const resendApiKey = defineSecret("RESEND_API_KEY");

/**
 * 6자리 인증 코드 생성
 * @return {string} 6자리 숫자 코드
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 이메일 인증 코드 전송
export const sendVerificationCode = onCall(
  {
    secrets: [resendApiKey],
  },
  async (request) => {
    const {email} = request.data;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError(
        "invalid-argument",
        "유효하지 않은 이메일입니다."
      );
    }

    try {
      // 이메일 중복 체크
      try {
        await admin.auth().getUserByEmail(email);
        throw new HttpsError(
          "already-exists",
          "이미 가입된 이메일입니다."
        );
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      // Resend 초기화
      const resend = new Resend(resendApiKey.value());

      // 인증 코드 생성
      const code = generateVerificationCode();
      const expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 5 * 60 * 1000)
      );

      // Firestore에 저장
      await db.collection("emailVerifications").doc(email).set({
        code,
        email,
        expiresAt,
        verified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Resend로 이메일 전송
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>이메일 인증 코드</h2>
          <p>WeatherFit 가입을 위한 인증 코드입니다.</p>
          <div style="background-color: #f5f5f5; padding: 15px;
            border-radius: 8px; margin: 20px 0;">
            <h1 style="margin: 0; font-size: 32px;
              letter-spacing: 4px;">${code}</h1>
          </div>
          <p style="color: #666;">이 코드는 5분 후 만료됩니다.</p>
        </div>
      `;

      await resend.emails.send({
        from: "WeatherFit <onboarding@resend.dev>",
        to: email,
        subject: "WeatherFit 이메일 인증 코드",
        html: htmlContent,
      });

      return {success: true, message: "인증 코드가 전송되었습니다."};
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error("이메일 전송 실패:", error);
      throw new HttpsError("internal", "이메일 전송에 실패했습니다.");
    }
  }
);

// 인증 코드 확인
export const verifyCode = onCall(async (request) => {
  const {email, code} = request.data;

  if (!email || !code) {
    throw new HttpsError(
      "invalid-argument",
      "이메일과 코드를 입력해주세요."
    );
  }

  try {
    const docRef = db.collection("emailVerifications").doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new HttpsError("not-found", "인증 요청을 찾을 수 없습니다.");
    }

    const data = doc.data();
    if (!data) {
      throw new HttpsError(
        "not-found",
        "인증 데이터를 찾을 수 없습니다."
      );
    }

    if (data.expiresAt.toDate() < new Date()) {
      throw new HttpsError(
        "deadline-exceeded",
        "인증 코드가 만료되었습니다."
      );
    }

    if (data.code !== code) {
      throw new HttpsError(
        "invalid-argument",
        "인증 코드가 일치하지 않습니다."
      );
    }

    await docRef.update({verified: true});

    return {success: true, message: "이메일 인증이 완료되었습니다."};
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error("코드 검증 실패:", error);
    throw new HttpsError("internal", "코드 검증에 실패했습니다.");
  }
});

// 인증 코드 무효화
export const invalidateVerification = onCall(async (request) => {
  const {email} = request.data;

  if (!email) {
    throw new HttpsError("invalid-argument", "이메일을 입력해주세요.");
  }

  try {
    await db.collection("emailVerifications").doc(email).delete();
    return {success: true, message: "인증이 초기화되었습니다."};
  } catch (error) {
    console.error("인증 초기화 실패:", error);
    throw new HttpsError("internal", "인증 초기화에 실패했습니다.");
  }
});
