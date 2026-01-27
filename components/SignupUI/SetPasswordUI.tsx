"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Input from "../Input";
import Button from "../Button";

interface SetPasswordUIProps {
  password: string;
  setPassword: (password: string) => void;
  onComplete: () => void;
}

export default function SetPasswordUI({
                                        password,
                                        setPassword,
                                        onComplete,
                                      }: SetPasswordUIProps) {
  const [confirmPw, setConfirmPw] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPwError, setConfirmPwError] = useState(false);
  const [complete, setComplete] = useState(false);

  const isValidPassword = (pw: string) => {
    // Firebase 비밀번호 요구사항: 최소 6자 (여기서는 더 강력한 규칙 사용)
    const regex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-{}[\]:;"'<>,.?/]).{8,}$/;
    return regex.test(pw);
  };

  useEffect(() => {
    if (!password) {
      setPasswordError(false);
      return;
    }

    setPasswordError(!isValidPassword(password));
  }, [password]);

  useEffect(() => {
    if (!confirmPw) {
      setConfirmPwError(false);
      return;
    }

    setConfirmPwError(password !== confirmPw);
  }, [password, confirmPw]);

  useEffect(() => {
    setComplete(
        !passwordError &&
        !confirmPwError &&
        password !== "" &&
        confirmPw !== ""
    );
  }, [passwordError, confirmPwError, password, confirmPw]);

  return (
      <div className="flex flex-col relative w-full justify-center items-center">
        <div className="mb-[17px]">
          <div className="text-base text-[16px] mb-[5px] ml-[18px]">비밀번호</div>
          <Input
              type="password"
              value={password}
              onChange={setPassword}
              error={passwordError}
          />
          {passwordError && (
              <p className="absolute left-[70px] text-[12px] text-warning">
                영어, 숫자, 특수문자 포함 8자 이상이어야 합니다!
              </p>
          )}
        </div>

        <div className="mb-[17px]">
          <div className="text-base text-[16px] mb-[5px] ml-[18px]">
            비밀번호 확인
          </div>
          <Input
              type="password"
              value={confirmPw}
              onChange={setConfirmPw}
              error={passwordError || confirmPwError}
          />
          {confirmPwError && (
              <p className="absolute left-[70px] mt-[2px] text-[12px] text-warning">
                비밀번호가 일치하지 않습니다!
              </p>
          )}
        </div>

        <div className="mt-[50px]">
          <Button disabled={!complete} onClick={onComplete}>
            다음 단계로
          </Button>
        </div>
      </div>
  );
}