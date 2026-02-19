import nodemailer from 'nodemailer';

// Transporter 생성
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 이메일 전송
export async function sendEmail (
    to: string,
    subject: string,
    html: string
) {
  try {
    const info = await transporter.sendMail({
      from: `"WeatherFit" <${process.env.GMAIL_USER}`,
      to,
      subject,
      html,
    });

    console.log('이메일 전송 완료:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('이메일 전송 실패:', error);
    throw error;
  }
}

// 인증 코드 생성
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}