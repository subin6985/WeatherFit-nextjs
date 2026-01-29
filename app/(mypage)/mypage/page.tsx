"use client";

import {useEffect, useState} from "react";
import {BaseProfile} from "../../../types";
import {doc, getDoc} from "firebase/firestore";
import {db} from "../../../lib/firebase";
import {useAuthStore} from "../../../store/useAuthStore";
import {useNavigationStore} from "../../../store/useNavigationStore";
import ProfileButton from "../../../components/ProfileButton";
import {useRouter} from "next/navigation";

export default function MyPage() {
  const { user } = useAuthStore.getState();
  const { setCurrentPage } = useNavigationStore();
  const router = useRouter();

  const [profile, setProfile] = useState<BaseProfile|null>(null);

  const fetchProfile = async () => {
    if (!user?.uid) return;

    const memberDoc = await getDoc(doc(db, 'users', user?.uid));

    if (!memberDoc.exists()) {
      console.error("사용자 문서를 찾을 수 없습니다.");
      return;
    }

    const memberProfile: BaseProfile = {
      id: memberDoc.id,
      profilePhoto: memberDoc.data().profilePhoto || '',
      nickname: memberDoc.data().nickname,
      email: memberDoc.data().email
    };

    setProfile(memberProfile);
  }

  useEffect(() => {
    if (!user) return;

    setCurrentPage('mypage');
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    else {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
  }, [user]);

  const onInfoClick = () => {
    router.push("/mypage/edit");
  }

  const onPostClick = () => {
    router.push("/mypage/mypost");
  }

  const onLikeClick = () => {
    router.push("/mypage/like");
  }

  const onDeleteClick = () => {
    router.push("/delete-account");
  }

  if (!user) {
    return null;
  }

  return (
      <div className="flex flex-col px-[45px] h-screen items-center">
        <div className="mt-[42px] mb-[24px]">
          {profile?.profilePhoto ? (
              <img
                width={145}
                height={145}
                src={profile?.profilePhoto}
                className="rounded-full"
              />
          ) : (
              <div className="w-[145px] h-[145px] rounded-full bg-light" />
          )}
        </div>
        <div className="flex flex-col justify-center gap-0 mb-[32px]">
          <div className="text-base text-xl text-center">{profile?.nickname}</div>
          <p className="text-light text-center">{profile?.email}</p>
        </div>
        <div className="flex flex-col gap-[19px]">
          <ProfileButton onClick={onInfoClick}>
            <>
              <img
                  src="/Info.png"
                  width={35}
                  height={35}
              />
              내 정보 수정
            </>
          </ProfileButton>
          <ProfileButton onClick={onPostClick}>
            <>
              <img
                  src="/Post.png"
                  width={35}
                  height={35}
              />
              내가 쓴 게시글
            </>
          </ProfileButton>
          <ProfileButton onClick={onLikeClick}>
            <>
              <img
                  src="/Like.png"
                  width={35}
                  height={35}
              />
              내가 좋아요 한 게시글
            </>
          </ProfileButton>
          <p className="text-warning text-center
                        underline cursor-pointer p-1
                        hover:text-warningAccent"
             onClick={onDeleteClick}>탈퇴하기</p>
        </div>
      </div>
  );
}