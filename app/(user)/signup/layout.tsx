"use client";

import {useRouter} from "next/navigation";

export default function SignupLayout({children}) {
  const router = useRouter();

  const returnToLogin = () => {
    router.push("/login");
  };

  return (
      <div className="flex flex-col relative h-screen justify-center items-center">
        <button onClick={returnToLogin} className="absolute left-[20px] top-[50px]">
          <img
              src="/Return.png"
              alt="Return"
              width={40}
              height={40}
              className="w-[40px] h-auto"
          />
        </button>

        <button onClick={returnToLogin}>
          <img
              src="/WeatherFit.png"
              alt="WeatherFit Logo"
              width={227}
              height={100}
              className="w-[227px] h-auto mb-[56px]"
          />
        </button>

        {children}
      </div>
  );
}