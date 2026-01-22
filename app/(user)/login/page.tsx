"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/useAuthStore"
import Input from "../../../components/Input";
import Button from "../../../components/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (email === "" || password === "") return;

    setIsLoading(true);
    setError(false);

    try {
      await login(email, password);
      router.push("/");
    } catch (e) {
      console.error("로그인 실패: ", e);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(false);

    try {
      await loginWithGoogle();
      router.push("/");
    } catch (e) {
      console.error("Google 로그인 실패: ", e);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const returnToMain = () => {
    router.push("/");
  };

  const handleSignupButton = () => {
    router.push("/signup");
  };

  return (
      <div className="flex flex-col relative h-screen justify-center items-center">
        <button
            onClick={returnToMain}
            className="absolute left-[20px] top-[50px]"
        >
          <img
              src="/Return.png"
              alt="Return"
              width={40}
              height={40}
              className="w-[40px] h-auto"
          />
        </button>

        <button onClick={returnToMain}>
          <img
              src="/WeatherFit.png"
              alt="WeatherFit Logo"
              width={227}
              height={100}
              className="w-[227px] h-auto mb-[56px]"
          />
        </button>

        <div className="mb-[17px]">
          <Input
              placeholder="이메일"
              value={email}
              onChange={setEmail}
              error={error}
          />
        </div>

        <div className="relative flex flex-col items-center mb-[29px]">
          <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={setPassword}
              error={error}
          />
          {error && (
              <div className="absolute text-[12px] text-warning left-3 top-12">
                이메일과 비밀번호를 다시 확인해 주세요!
              </div>
          )}
        </div>

        <Button disabled={isLoading} onClick={handleLogin}>
          {isLoading ? "로그인 중..." : "로그인"}
        </Button>

        <div className="mt-[17px] flex flex-row justify-center gap-[25px]">
          <button onClick={handleGoogleLogin} disabled={isLoading}>
            <img
                src="/Google.png"
                alt="Google Login"
                width={35}
                height={35}
                className="w-[35px] h-auto"
            />
          </button>
          {/* 카카오 로그인은 추후 구현 */}
          <button disabled>
            <img
                src="/Kakao.png"
                alt="Kakao Login"
                width={35}
                height={35}
                className="w-[35px] h-auto opacity-50"
            />
          </button>
        </div>

        <button
            onClick={handleSignupButton}
            className="text-[16px] text-light mt-[25px] hover:text-middle"
        >
          회원가입
        </button>
      </div>
  );
}