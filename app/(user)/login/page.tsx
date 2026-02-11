"use client";

import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/useAuthStore"
import Input from "../../../components/baseUI/Input";
import Button from "../../../components/baseUI/Button";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading, isLoggedIn } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn) {
      router.push("/");
      return;
    }
  }, [isLoading, isLoggedIn, router]);

  const handleLogin = async () => {
    if (email === "" || password === "") return;

    setLoading(true);
    setError(false);

    try {
      await login(email, password);
      router.replace("/");
    } catch (e) {
      console.error("로그인 실패: ", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(false);

    try {
      const { isNewUser } = await loginWithGoogle();

      // 신규 사용자면 닉네임 설정 페이지로
      if (isNewUser) {
        router.push("/signup/finish-google");
      } else {
        router.replace("/");
      }
    } catch (e) {
      console.error("Google 로그인 실패: ", e);

      // 같은 이메일로 다른 방식으로 가입할 경우
      if (e.code === "auth/account-exists-with-different-credential") {
        alert("이 이메일은 이미 다른 방법으로 가입되어 있습니다. \n일반 로그인으로 로그인해주세요.");
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const returnToMain = () => {
    router.push("/");
  };

  const handleSignupButton = () => {
    router.push("/signup");
  };

  if (isLoading || isLoggedIn) return null;

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

        <form onSubmit={handleLogin}>
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

          <Button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <div className="mt-[17px] flex flex-row justify-center gap-[25px]">
          <button onClick={handleGoogleLogin} disabled={loading}>
            <img
                src="/Google.png"
                alt="Google Login"
                width={35}
                height={35}
                className="w-[35px] h-auto"
            />
          </button>
          {/* 카카오 로그인은 추후 구현
          <button disabled>
            <img
                src="/Kakao.png"
                alt="Kakao Login"
                width={35}
                height={35}
                className="w-[35px] h-auto opacity-50"
            />
          </button>
          */}
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