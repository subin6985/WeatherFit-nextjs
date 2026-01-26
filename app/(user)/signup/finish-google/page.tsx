"use client";

import {useRouter} from "next/navigation";
import {useAuthStore} from "../../../../store/useAuthStore";
import {useEffect, useState} from "react";
import {updateProfile} from "firebase/auth";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "../../../../lib/firebase";
import Input from "../../../../components/Input";
import Button from "../../../../components/Button";

export default function FinishGooglePage() {
  const router = useRouter();
  const { user } = useAuthStore.getState();

  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 로그인되지 않은 경우 로그인 페이지로
    if (!user) {
      router.push("/login");
      return;
    }

    // 구글 계정의 닉네임으로 설정
    if (user.displayName) {
      setNickname(user.displayName.slice(0, 15));
    }
  }, [user, router]);

  const handleComplete = async () => {
    if (!nickname.trim() || !user) return;

    setIsLoading(true);
    setError("");

    try {
      // Firebase Auth displayName 업데이트
      await updateProfile(user, {
        displayName: nickname,
      });

      // Firestore users 컬렉션 업데이트
      await updateDoc(doc(db, "users", user.uid), {
        nickname: nickname,
      });

      // 홈으로 이동
      router.push("/");
    } catch (err: any) {
      console.error("닉네임 설정 실패:", err);
      setError("닉네임 설정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google displayName 그대로 사용하고 홈으로
  const handleSkip = () => {
    router.push("/");
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

        <div className="mt-[50px] flex flex-col gap-[10px]">
          <Button
              disabled={nickname === "" || isLoading}
              onClick={handleComplete}
          >
            {isLoading ? "설정 중..." : "완료"}
          </Button>

          {user?.displayName && (
              <Button
                  onClick={handleSkip}
              >
                건너뛰기
              </Button>
          )}
        </div>
      </div>
  );
}