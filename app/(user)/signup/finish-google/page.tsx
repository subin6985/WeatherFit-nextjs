"use client";

import {useRouter} from "next/navigation";
import {useAuthStore} from "../../../../store/useAuthStore";
import {useEffect, useState} from "react";
import {updateProfile} from "firebase/auth";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "../../../../lib/firebase";
import Input from "../../../../components/baseUI/Input";
import Button from "../../../../components/baseUI/Button";
import {Gender, GENDER_LABEL, GENDER_LIST} from "../../../../types";

export default function FinishGooglePage() {
  const router = useRouter();
  const { user } = useAuthStore.getState();

  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.NO_SELECT);

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
        gender: selectedGender
      });

      // 홈으로 이동
      router.replace("/");
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