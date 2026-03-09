"use client";

import {useRouter} from "next/navigation";
import Image from "next/image";

export default function SignupLayout({children}) {
  const router = useRouter();

  const returnToLogin = () => {
    router.push("/login");
  };

  return (
      <div className="flex flex-col relative h-screen justify-center items-center">
        <button onClick={returnToLogin} className="absolute left-[20px] top-[50px]">
          <Image
              src="/Return.png"
              alt="Return"
              width={40}
              height={40}
              sizes="40px"
          />
        </button>

        <button onClick={returnToLogin}>
          <Image
              src="/WeatherFit.png"
              alt="WeatherFit Logo"
              width={227}
              height={100}
              className="mb-[56px]"
              sizes="227px"
          />
        </button>

        {children}
      </div>
  );
}