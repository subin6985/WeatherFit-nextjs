"use client";

import Image from "next/image";
import {useRouter} from "next/navigation";
import {useWriteStore} from "../../store/useWriteStore";

export default function FeedLayout({children}) {
  const router = useRouter();
  const { step, setStep } = useWriteStore();

  const handleBackClick = () => {
    if (step > 1) {
      setStep(1);
    } else {
      router.back();
    }
  }

  return (
      <div className="flex flex-col overflow-hidden relative h-screen justify-start">
        <button
            onClick={handleBackClick}
            className="absolute left-[20px] top-[50px] z-20"
        >
          <Image src="/Return.png" alt="뒤로가기" width={40} height={40} />
        </button>

        <div className="w-full h-[100px] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.1)] shrink-0 z-10" />

        {children}
      </div>
  );
}