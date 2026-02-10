"use client";

import {useRouter} from "next/navigation";
import {useNavigationStore} from "../../store/useNavigationStore";
import {useEffect} from "react";

export default function MypageLayout({children}) {
  const router = useRouter();
  const { currentPage } = useNavigationStore();

  useEffect(() => {
    console.log("Current page:", currentPage);
  }, [currentPage]);

  const handleBackClick = () => {
    if (currentPage === 'mypage') {
      router.push('/');
      return;
    }

    router.back();
  }

  return (
      <div className="flex flex-col overflow-hidden relative h-screen justify-center">
        <button
            onClick={handleBackClick}
            className="absolute left-[20px] top-[30px] z-20"
        >
          <img src="/Return.png" alt="뒤로가기" width={40} height={40}/>
        </button>
        <div className="w-full h-[80px] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.1)] shrink-0 z-10"/>

          {children}
      </div>
  );
}