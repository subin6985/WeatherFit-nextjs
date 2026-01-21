"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { updateProfile } from "firebase/auth";
import { useAuthStore } from "../../store/useAuthStore";
import Input from "../Input";
import Button from "../Button";

interface FinishUIProps {
  email: string;
  password: string;
  nickname: string;
  setNickname: (nickname: string) => void;
}

export default function FinishUI({
                                   email,
                                   password,
                                   nickname,
                                   setNickname,
                                 }: FinishUIProps) {
  const router = useRouter();
  const { signUp } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const returnToLogin = () => {
    router.push("/login");
  };

  const handleSignup = async () => {
    if (!nickname.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // Firebase에 회원가입
      await signUp(email, password);

      // 닉네임 설정 (Firebase displayName 사용)
      const { user } = useAuthStore.getState();
      if (user) {
        await updateProfile(user, {
          displayName: nickname,
        });
      }

      // 성공 → 로그인 화면으로
      router.push("/login");
    } catch (err: any) {
      console.error("회원가입 실패:", err);

      // Firebase 에러 메시지 한글화
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호가 너무 약합니다.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="flex flex-col relative h-screen justify-center items-center">
        <button onClick={returnToLogin} className="absolute left-[20px] top-[50px]">
          <Image
              src="/Return.png"
              alt="Return"
              width={40}
              height={40}
              className="w-[40px] h-auto"
          />
        </button>

        <button onClick={returnToLogin}>
          <Image
              src="/WeatherFit.png"
              alt="WeatherFit Logo"
              width={227}
              height={100}
              className="w-[227px] h-auto mb-[56px]"
          />
        </button>

        <div className="mb-[17px]">
          <div className="text-base text-[16px] mb-[5px] ml-[18px]">닉네임</div>
          <div className="flex flex-row justify-between gap-[10px]">
            <Input value={nickname} onChange={setNickname} />
          </div>
        </div>

        {error && (
            <div className="text-[14px] text-warning mb-4">
              {error}
            </div>
        )}

        <div className="mt-[50px]">
          <Button
              disabled={nickname === "" || isLoading}
              onClick={handleSignup}
          >
            {isLoading ? "회원가입 중..." : "회원가입"}
          </Button>
        </div>
      </div>
  );
}