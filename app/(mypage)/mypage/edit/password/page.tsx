"use client";

import {useNavigationStore} from "../../../../../store/useNavigationStore";
import {useEffect, useState} from "react";
import SmallButton from "../../../../../components/SmallButton";
import {useAuthStore} from "../../../../../store/useAuthStore";
import {doc, getDoc} from "firebase/firestore";
import {db} from "../../../../../lib/firebase";
import {updateProfile} from "firebase/auth";
import {useRouter} from "next/navigation";
import Input from "../../../../../components/Input";

export default function EditPasswordPage () {
  const { setCurrentPage } = useNavigationStore();
  const { user, isLoading, isLoggedIn, changePassword } = useAuthStore();

  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState<String>("");
  const [newPassword, setNewPassword] = useState<String>("");
  const [confirmPw, setConfirmPw] = useState("");
  const [matchError, setMatchError] = useState<Boolean>(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPwError, setConfirmPwError] = useState(false);
  const [loading, setLoading] = useState<Boolean>(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setCurrentPage('password');

    if (isLoading) return;

    if (!isLoggedIn || !user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const providerData = user.providerData[0];
    if (providerData?.providerId === 'google.com') {
      alert("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
      router.push("/mypage/edit");
      return;
    }
  }, [isLoading, isLoggedIn, user]);

  const isValidPassword = (pw: string) => {
    const regex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]).{8,}$/;
    return regex.test(pw);
  };

  useEffect(() => {
    if (!newPassword) {
      setPasswordError(false);
      return;
    }

    setPasswordError(!isValidPassword(newPassword));
  }, [newPassword]);

  useEffect(() => {
    if (!confirmPw) {
      setConfirmPwError(false);
      return;
    }

    setConfirmPwError(newPassword !== confirmPw);
  }, [newPassword, confirmPw]);

  useEffect(() => {
    setComplete(
        !passwordError &&
        !confirmPwError &&
        currentPassword !== "" &&
        newPassword !== "" &&
        confirmPw !== ""
    );
  }, [passwordError, confirmPwError, currentPassword, newPassword, confirmPw]);

  const handleComplete = async () => {
    if (!newPassword) {
      alert("새 비밀번호를 입력해 주세요.");
      return;
    }

    if (passwordError) {
      alert("비밀번호 형식이 잘못되었습니다.");
      return;
    }

    if (confirmPwError) {
      alert("확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword === currentPassword) {
      alert("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      alert("비밀번호가 성공적으로 변경되었습니다.");
      router.push("/mypage");
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {

      }
      alert(error.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
          로딩 중...
        </div>
    );
  }

  return (
      <div className="flex flex-col px-[45px] h-screen items-center">
        <div className="absolute top-[30px] right-[20px] z-20">
          <SmallButton onClick={handleComplete}
                       disabled={!newPassword || loading || !complete}
          >
            저장
          </SmallButton>
        </div>
        <div className="flex flex-col gap-[17px]">
          <div>
            <label>현재 비밀번호</label>
            <Input
                type="password"
                error={matchError}
                value={currentPassword}
                onChange={setCurrentPassword}
            />
          </div>
          <div>
            <label>새 비밀번호</label>
            <Input
                type="password"
                error={passwordError}
                value={newPassword}
                onChange={setNewPassword}
            />
            {passwordError && (
                <p className="absolute left-[70px] text-[12px] text-warning">
                  영어, 숫자, 특수문자 포함 8자 이상이어야 합니다!
                </p>
            )}
          </div>
          <div>
            <label>새 비밀번호 확인</label>
            <Input
                type="password"
                error={confirmPwError}
                value={confirmPw}
                onChange={setConfirmPw}
            />
            {confirmPwError && (
                <p className="absolute left-[70px] mt-[2px] text-[12px] text-warning">
                  비밀번호가 일치하지 않습니다!
                </p>
            )}
          </div>
        </div>
      </div>
  );
}