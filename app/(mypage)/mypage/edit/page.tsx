"use client";

import {useNavigationStore} from "../../../../store/useNavigationStore";
import {useEffect, useRef, useState} from "react";
import {useAuthStore} from "../../../../store/useAuthStore";
import {useRouter} from "next/navigation";
import {Gender, GENDER_LABEL, GENDER_LIST, ProfileDetail} from "../../../../types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import {db, storage} from "../../../../lib/firebase";
import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {updateProfile} from "firebase/auth";
import SmallButton from "../../../../components/baseUI/SmallButton";
import ProfileButton from "../../../../components/ProfileButton";
import {recalculateStats} from "../../../../lib/services/clothingStatsService";

export default function EditInfoPage () {
  const { user } = useAuthStore.getState();
  const { setCurrentPage } = useNavigationStore();

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileDetail|null>(null);
  const [file, setFile] = useState<File|null>(null);
  const [profilePhotoURL, setProfilePhotoURL] = useState<String>("");
  const [nickname, setNickname] = useState<String>("");
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.NO_SELECT);

  useEffect(() => {
    if (!user) return;

    setCurrentPage('normal');
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

  const fetchProfile = async () => {
    if (!user?.uid) return;

    const memberDoc = await getDoc(doc(db, 'users', user?.uid));

    if (!memberDoc.exists()) {
      console.error("사용자 문서를 찾을 수 없습니다.");
      return;
    }

    const memberProfile: ProfileDetail = {
      id: memberDoc.id,
      profilePhoto: memberDoc.data().profilePhoto || '',
      nickname: memberDoc.data().nickname,
      email: memberDoc.data().email,
      gender: memberDoc.data().gender || "NO_SELECT",
      password: memberDoc.data().password
    };

    setProfile(memberProfile);
    setNickname(memberProfile.nickname);
    setSelectedGender(memberProfile.gender as Gender);
    setProfilePhotoURL(memberProfile.profilePhoto)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      setFile(selectedFile);
      setProfilePhotoURL(URL.createObjectURL(selectedFile));
    }
  }

  const onPasswordClick = () => {
    router.push("/mypage/edit/password")
  }

  const handleComplete = async () => {
    if (nickname === "") {
      alert("닉네임은 비워둘 수 없습니다.");
      return;
    }
    try {
      let avatarUrl = profile?.profilePhoto || "";

      // 프로필 사진이 바뀐 경우
      if (file) {
        const locationRef = ref(storage, `avatars/${user?.uid}`);
        const result = await uploadBytes(locationRef, file);
        avatarUrl = await getDownloadURL(result.ref);
      }

      // 성별이 바뀐 경우
      if (profile.gender != selectedGender) {
        // 통계 재계산
        await recalculateStats(user.uid, selectedGender);

        // 모든 게시물의 gender 필드 업데이트
        const postQuery = query(
            collection(db, 'posts'),
            where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(postQuery);

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { gender: selectedGender });
        });

        await batch.commit();
      }

      const userDocRef = doc(db, "users", user?.uid);
      await updateDoc(userDocRef, {
        profilePhoto: avatarUrl,
        nickname: nickname,
        gender: selectedGender
      });
      await updateProfile(user, {
        displayName: nickname,
        photoURL: avatarUrl,
      })

      alert("프로필이 업데이트 되었습니다.");
      router.push("/mypage");
    } catch (err) {
      alert("프로필 업데이트에 실패했습니다.");
      console.log("Fail to update profile:", err);
    }
  }

  // Google 로그인 여부 확인 함수
  const isGoogleUser = () => {
    if (!user) return false;
    return user.providerData.some(provider => provider.providerId === 'google.com');
  };

  if (!user) {
    return null;
  }

  return (
      <div className="flex flex-col px-[45px] h-screen items-center">
        <div className="absolute top-[30px] right-[20px] z-20">
          <SmallButton onClick={handleComplete}
                       disabled={!nickname ||
                                  (nickname === profile?.nickname &&
                                  file === profile?.profilePhoto &&
                                  selectedGender === profile?.gender)}
                       >
            저장
          </SmallButton>
        </div>
        <div onClick={handleImageClick} className="group relative flex flex-col mt-[42px] mb-[24px] cursor-pointer">
          {profilePhotoURL ? (
              <img
                  width={145}
                  height={145}
                  src={profilePhotoURL}
                  className="rounded-full"
              />
          ) : (
              <div className="w-[145px] h-[145px] rounded-full bg-light"/>
          )}
          <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
          />
          <img
            src="/SelectPhoto.png"
            width={35}
            height={35}
            className="absolute bottom-0 right-0 group-hover:brightness-75 transition-all duration-100 ease-in-out"
          />
        </div>
        <textarea
            value={nickname}
            placeholder={profile?.nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={14}
            rows={1}
            className="text-base text-xl text-center w-full
                       mb-[47px] p-[4px]
                       border-b-[2px] border-light resize-none focus:outline-none" />
        <div className="flex flex-col gap-[14px] mb-[50px]">
          <div className="text-[16px] items-center">성별</div>
          <div className="flex items-center gap-[40px]">
            {GENDER_LIST.map((gender) => (
                <label
                  key={gender}
                  className="flex items-center gap-[5px] cursor-pointer"
                  >
                  <div className="relative w-5 h-5">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={selectedGender === gender}
                      onChange={() => setSelectedGender(gender)}
                      className="peer appearance-none w-5 h-5
                            border-2 border-base rounded-full cursor-pointer
                            checked:border-base checked:border-[6px] transition-all"
                    />
                  </div>
                  <span className="text-[14px] text-base">
                    {GENDER_LABEL[gender]}
                  </span>
                </label>
            ))}
          </div>
        </div>
        {!isGoogleUser() && (
            <ProfileButton onClick={onPasswordClick} className="min-w-[257px]">
              <>
                <img
                    src="/Lock.png"
                    width={35}
                    height={35}
                />
                비밀번호 변경
              </>
            </ProfileButton>
        )}
      </div>
  );
}