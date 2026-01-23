"use client";

import {useRouter} from "next/navigation";
import {useWriteStore} from "../../store/useWriteStore";
import {useNavigationStore} from "../../store/useNavigationStore";

export default function FeedLayout({children}) {
  const router = useRouter();
  const { step, setStep } = useWriteStore();
  const { currentPage } = useNavigationStore();

  const handleBackClick = () => {
    // feed 페이지
    if (currentPage === 'feed') {
      router.push('/');
      return;
    }

    // write 페이지 1단계
    if (currentPage === 'write' && step === 1) {
      router.push('/feed');
      return;
    }

    // write 페이지 2단계
    if (currentPage === 'write' && step === 2) {
      setStep(1);
      return;
    }

    // post 상세 페이지
    if (currentPage === 'post') {
      router.push('/feed');
    }

    // 기본 동작
    router.back();
  }

  return (
      <div className="flex flex-col overflow-hidden relative h-screen justify-start">
        <button
            onClick={handleBackClick}
            className="absolute left-[20px] top-[30px] z-20"
        >
          <img src="/Return.png" alt="뒤로가기" width={40} height={40} />
        </button>

        <div className="w-full h-[80px] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.1)] shrink-0 z-10" />

        {children}
      </div>
  );
}