"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { REGIONS, getRegionCoords, TempRange } from "../../types";
import { fetchWeatherForDate, tempRangeToString } from "../../lib/weatherUtils";
import { createPost } from "../../lib/services/postService";
import { useAuth } from "../../hooks/useAuth";
import SmallButton from "../SmallButton";

interface StepTwoUIProps {
  file: File | null;
  outfitRegion: string;
  setOutfitRegion: (region: string) => void;
  outfitDate: Date | null;
  setOutfitDate: (date: Date | null) => void;
  content: string;
  setContent: (content: string) => void;
}

export default function StepTwoUI({
                                    file,
                                    outfitRegion,
                                    setOutfitRegion,
                                    outfitDate,
                                    setOutfitDate,
                                    content,
                                    setContent,
                                  }: StepTwoUIProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [openRegionDropdown, setOpenRegionDropdown] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<{
    temp: number;
    tempRange: TempRange;
  } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 지역과 날짜가 모두 선택되면 날씨 정보 가져오기
  useEffect(() => {
    if (outfitRegion && outfitDate) {
      fetchWeather();
    }
  }, [outfitRegion, outfitDate]);

  const fetchWeather = async () => {
    if (!outfitRegion || !outfitDate) return;

    const coords = getRegionCoords(outfitRegion);
    if (!coords) return;

    setLoadingWeather(true);
    try {
      const weather = await fetchWeatherForDate(
          coords.lat,
          coords.lon,
          outfitDate
      );
      setWeatherInfo(weather);
    } catch (error) {
      console.error("날씨 정보 가져오기 실패:", error);
      setWeatherInfo(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      alert("오늘 이후 날짜는 선택할 수 없습니다.");
      return;
    }

    setOutfitDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("이미지가 없습니다.");
      return;
    }

    if (!outfitRegion) {
      alert("지역을 선택해주세요.");
      return;
    }

    if (!outfitDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (!weatherInfo) {
      alert("날씨 정보를 불러오는 중입니다. 잠시만 기다려주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    try {
      setSubmitting(true);

      // 사용자 gender 정보 가져오기 (Firestore users 컬렉션에서)
      const userDoc = await import("firebase/firestore").then((mod) =>
          mod.getDoc(mod.doc(import("../../lib/firebase").then((m) => m.db), "users", user.uid))
      );

      const gender = userDoc.exists() ? userDoc.data()?.gender || "NO_SELECT" : "NO_SELECT";

      await createPost({
        file,
        content,
        tempRange: weatherInfo.tempRange,
        region: outfitRegion,
        outfitDate,
        userId: user.uid,
        gender,
      });

      alert("게시글이 작성되었습니다!");
      router.push("/feed");
    } catch (error) {
      console.error("게시글 작성 실패:", error);
      alert("게시글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로
  const today = new Date().toISOString().split("T")[0];

  return (
      <div className="flex flex-col relative h-screen">
        <div className="flex-1 overflow-y-auto pt-[16px] px-[20px] pb-[20px]">
          {/* 지역 선택 */}
          <div className="mb-[20px]">
            <label className="text-base text-[16px] mb-[8px] block">
              이 옷을 입은 지역
            </label>
            <div className="relative">
              <button
                  onClick={() => setOpenRegionDropdown(!openRegionDropdown)}
                  className="w-full px-[16px] py-[12px] border border-light rounded-lg
                         text-left text-[16px] bg-white flex justify-between items-center"
              >
              <span className={outfitRegion ? "text-base" : "text-middle"}>
                {outfitRegion || "지역 선택"}
              </span>
                <Image src="/Down.png" alt="드롭다운" width={16} height={16} />
              </button>

              {openRegionDropdown && (
                  <div className="absolute top-full mt-[8px] w-full bg-white border border-light
                            rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-20">
                    {REGIONS.map((region) => (
                        <button
                            key={region.name}
                            onClick={() => {
                              setOutfitRegion(region.name);
                              setOpenRegionDropdown(false);
                            }}
                            className="w-full px-[16px] py-[12px] text-left hover:bg-snow
                             text-[16px] text-base"
                        >
                          {region.name}
                        </button>
                    ))}
                  </div>
              )}
            </div>
          </div>

          {/* 날짜 선택 */}
          <div className="mb-[20px]">
            <label className="text-base text-[16px] mb-[8px] block">
              이 옷을 입은 날짜
            </label>
            <input
                type="date"
                max={today}
                value={outfitDate ? outfitDate.toISOString().split("T")[0] : ""}
                onChange={handleDateChange}
                className="w-full px-[16px] py-[12px] border border-light rounded-lg
                     text-[16px] text-base"
            />
            <p className="text-[12px] text-middle mt-[4px]">
              * 지역과 날짜에 맞는 날씨를 자동으로 찾아드려요
            </p>
          </div>

          {/* 날씨 정보 표시 */}
          {loadingWeather && (
              <div className="mb-[20px] p-[16px] bg-snow rounded-lg">
                <p className="text-[14px] text-middle">날씨 정보를 불러오는 중...</p>
              </div>
          )}

          {weatherInfo && !loadingWeather && (
              <div className="mb-[20px] p-[16px] bg-snow rounded-lg">
                <p className="text-[14px] text-base">
                  예상 기온: <span className="font-bold">{weatherInfo.temp}℃</span>
                </p>
                <p className="text-[14px] text-middle mt-[4px]">
                  ({tempRangeToString(weatherInfo.tempRange)})
                </p>
              </div>
          )}

          {/* 내용 입력 */}
          <div className="mb-[20px]">
            <label className="text-base text-[16px] mb-[8px] block">내용</label>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘의 코디에 대해 설명해주세요"
                maxLength={300}
                className="w-full px-[16px] py-[12px] border border-light rounded-lg
                     text-[16px] text-base resize-none h-[150px]"
            />
            <p className="text-[12px] text-middle text-right mt-[4px]">
              {content.length}/300
            </p>
          </div>

          {/* 등록 버튼 */}
          <div className="flex mt-[17px] justify-end">
            <SmallButton
                onClick={handleSubmit}
                disabled={
                    !file ||
                    !outfitRegion ||
                    !outfitDate ||
                    !weatherInfo ||
                    !content.trim() ||
                    submitting
                }
            >
              {submitting ? "등록 중..." : "등록"}
            </SmallButton>
          </div>
        </div>
      </div>
  );
}