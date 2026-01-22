"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import Input from "../Input";
import SmallButton from "../SmallButton";
import Button from "../Button";
import {functions} from "../../lib/firebase";

interface EmailVerificationUIProps {
  email: string;
  setEmail: (email: string) => void;
  onComplete: () => void;
}

export default function EmailVerificationUI({
                                              email,
                                              setEmail,
                                              onComplete,
                                            }: EmailVerificationUIProps) {
  const router = useRouter();

  const [emailError, setEmailError] = useState(false);
  const [sent, setSent] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [complete, setComplete] = useState(false);

  const [loading, setLoading] = useState(false);

  // 이메일 형식 검증
  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailButton = async () => {
    if (sent) {
      setEmail("");
      setSent(false);
      setCode("");
      setCodeError(false);
      setComplete(false);

      try {
        const invalidate = httpsCallable(functions, 'invalidateVerification');
        await invalidate({ email });
      } catch (err) {
        console.error("이메일 무효화 실패:", err);
      }
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError(true);
      return;
    }

    try {
      setLoading(true);
      const sendCode = httpsCallable(functions, 'sendVerificationCode');
      await sendCode({ email });

      setEmailError(false);
      setSent(true);
    } catch (err) {
      console.error("이메일 전송 실패:", err);
      setEmailError(true);

      if (err.code === "functions/already-exists") {
        alert("이미 가입된 이메일입니다.");
      }
      else alert(err.message || '이메일 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) {
      setCodeError(true);
      return;
    }

    try {
      setLoading(true);
      const verify = httpsCallable(functions, 'verifyCode');
      await verify({ email, code });

      setCodeError(false);
      setComplete(true);
    } catch (err) {
      console.error("코드 검증 실패:", err);
      setCodeError(true);
      setComplete(false);

      if (err.code === 'functions/deadline-exceeded') {
        alert('인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.');
      } else if (err.code === 'functions/invalid-argument') {
        alert('인증 코드가 일치하지 않습니다.');
      } else {
        alert(err.message || '코드 검증에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col relative justify-center items-center">
        <div className="mb-[17px]">
          <div className="text-base text-[16px] mb-[5px] ml-[18px]">
            ID (이메일)
          </div>
          <div className="flex flex-row justify-between gap-[10px]">
            <Input
                value={email}
                onChange={setEmail}
                error={emailError}
                disabled={sent || loading}
            />
            <SmallButton disabled={loading} onClick={handleEmailButton}>
              {sent ? "변경하기" : "코드 전송"}
            </SmallButton>
          </div>
        </div>

        <div>
          <div className="text-base text-[16px] mb-[5px] ml-[18px]">인증코드</div>
          <div className="flex flex-row justify-between gap-[10px]">
            <Input
                value={code}
                disabled={!sent || loading || complete}
                onChange={setCode}
                error={codeError}
            />
            <SmallButton disabled={!sent || loading || complete} onClick={verifyCode}>
              코드 확인
            </SmallButton>
          </div>
        </div>

        <div className="mt-[50px]">
          <Button disabled={!complete || loading} onClick={onComplete}>
            다음 단계로
          </Button>
        </div>

        {loading && (
            <div className="mt-4 text-sm text-light">처리 중...</div>
        )}
      </div>
  );
}