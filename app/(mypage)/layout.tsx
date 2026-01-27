"use client";

import {useRouter} from "next/navigation";
import {useNavigationStore} from "../../store/useNavigationStore";

export default function MypageLayout({children}) {
  const router = useRouter();
  const { currentPage } = useNavigationStore();

  const handleBackClick = () => {
    console.log("currentPage:", currentPage);

    if (currentPage === 'mypage') {
      router.push('/');
      return;
    }

    if (currentPage === 'detail') {
      router.push('/mypage');
      return;
    }

    if (currentPage === 'password') {
      router.push('/mypage/edit');
      return;
    }

    // 기본 동작
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
        <div className="w-full h-[80px] bg-white shrink-0 z-10"/>

          {children}
      </div>
  );
}