"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { useAuthStore } from "../../store/useAuthStore";
import Input from "../baseUI/Input";
import Button from "../baseUI/Button";
import {db} from "../../lib/firebase";
import {doc, setDoc} from "firebase/firestore";

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

      // Firestore users 컬렉션에도 저장
      await setDoc(doc(db, 'users', user.uid), {
        nickname: nickname,
        email: user.email,
        profilePhoto: '',
        createdAt: Date.now(),
        gender: "NO_SELECT"
      });

      // 성공 → 로그인 화면으로
      router.replace("/login");
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
      <div className="flex flex-col relative justify-center items-center">
        <div className="mb-[17px]">
          <div className="text-base text-[16px] mb-[5px] ml-[18px]">닉네임</div>
          <div className="flex flex-row justify-between gap-[10px]">
            <Input type="nickname" value={nickname} onChange={setNickname} />
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