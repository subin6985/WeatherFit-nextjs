"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { useAuthStore } from "../../store/useAuthStore";
import Input from "../baseUI/Input";
import Button from "../baseUI/Button";
import {db} from "../../lib/firebase";
import {doc, setDoc} from "firebase/firestore";
import {Gender, GENDER_LABEL, GENDER_LIST} from "../../types";

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
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.NO_SELECT);

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
        gender: selectedGender
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
            <Input type="nickname" value={nickname} onChange={setNickname}/>
          </div>
        </div>

        {error && (
            <div className="text-[14px] text-warning mb-4">
              {error}
            </div>
        )}

        <div className="flex flex-col gap-[14px] mt-[10px] mb-[50px]">
          <div className="text-[16px] items-center ml-[18px]">성별</div>
          <div className="flex items-center gap-[25px]">
            {GENDER_LIST.map((gender) => (
                <label
                    key={gender}
                    className="flex items-center gap-[5px] cursor-pointer"
                >
                  <div className="relative h-5">
                    <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={selectedGender === gender}
                        onChange={() => setSelectedGender(gender)}
                        className="peer appearance-none w-5 h-5
                            border-2 border-base rounded-full cursor-pointer
                            checked:border-base checked:border-[6px] transition-all"
                    />
                  </div>
                  <span className="text-[14px] text-base">
                    {GENDER_LABEL[gender]}
                  </span>
                </label>
            ))}
          </div>
        </div>

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