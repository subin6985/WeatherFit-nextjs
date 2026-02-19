"use client";

import { useRouter } from "next/navigation";
import {useEffect, useState} from "react";
import Input from "../baseUI/Input";
import SmallButton from "../baseUI/SmallButton";
import Button from "../baseUI/Button";
import {useAuthStore} from "../../store/useAuthStore";

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
  const { isLoading, isLoggedIn } = useAuthStore();

  const [emailError, setEmailError] = useState(false);
  const [sent, setSent] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [complete, setComplete] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn) {
      router.push("/");
      return;
    }
  }, [isLoading, isLoggedIn, router]);

  // 이메일 형식 검증
  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailButton = async () => {
    if (sent) {
      try {
        const response = await fetch('/api/invalidate-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })

        const data = await response.json();

        if (response.ok) {
          alert(data.message);

          setEmail("");
          setSent(false);
          setCode("");
          setCodeError(false);
          setComplete(false);
        } else {
          alert(data.error);
        }
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

      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);

        setEmailError(false);
        setSent(true);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("이메일 전송 실패:", err);
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

      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (response.ok) {
        setCodeError(false);
        setComplete(true);
      } else {
        setCodeError(true);
        alert(data.error);
      }
    } catch (err) {
      console.error("코드 검증 실패:", err);
      setCodeError(true);
      setComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || isLoggedIn) return null;

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