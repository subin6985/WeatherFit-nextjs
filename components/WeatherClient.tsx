"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ratio from "./Ratio";
import {useAuthStore} from "../store/useAuthStore";
import {auth} from "../lib/firebase";
import {useNavigationStore} from "../store/useNavigationStore";
import NotificationBell from "./NotificationBell";
import {useChatStore} from "../store/useChatStore";
import ChatIcon from "./chat/ChatIcon";

type WeatherBackground = "bg-sunny" | "bg-cloudy" | "bg-snowy" | "bg-rainy";

export default function WeatherClient() {
  const router = useRouter();

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { user } = useAuthStore.getState();
  const { setCurrentPage } = useNavigationStore();
  const { openChatList } = useChatStore();

  const [bg, setBg] = useState<WeatherBackground>("bg-sunny");
  const [currTemp, setCurrTemp] = useState(25);
  const [avgTemp, setAvgTemp] = useState(25);
  const [avgWeather, setAvgWeather] = useState("맑음");
  const [isLoading, setIsLoading] = useState(false);

  // 날씨를 배경으로 매핑
  const mapWeatherToBackground = (main: string): WeatherBackground => {
    if (main === "Clear") return "bg-sunny";
    if (main === "Clouds") return "bg-cloudy";
    if (main === "Snow") return "bg-snowy";
    if (main === "Rain" || main === "Drizzle" || main === "Thunderstorm") {
      return "bg-rainy";
    }
    return "bg-cloudy";
  };

  const fetchWeather = async (lat: number, lon: number) => {
    const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

    if (!API_KEY) {
      console.error("Weather API key not found");
      return;
    }

    try {
      setIsLoading(true);

      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Weather API error");

      const data = await res.json();
      setCurrTemp(Math.round(data.current.temp));
      setAvgTemp(Math.round(data.daily[0].temp.day));

      const resWeather = data.daily[0].weather[0].main;

      if (resWeather === "Clear") setAvgWeather("맑음");
      else if (resWeather === "Clouds") setAvgWeather("흐림");
      else if (resWeather === "Snow") setAvgWeather("눈");
      else if (
          resWeather === "Rain" ||
          resWeather === "Drizzle" ||
          resWeather === "Thunderstorm"
      ) {
        setAvgWeather("비");
      } else setAvgWeather("흐림");

      const mainWeather = data.current.weather[0].main;
      setBg(mapWeatherToBackground(mainWeather));
      setIsLoading(false);
    } catch (error) {
      console.error("날씨 정보를 가져오는데 실패했습니다:", error);
      setBg("bg-cloudy");
    }
  };

  useEffect(() => {
    setCurrentPage('normal');

    navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeather(latitude, longitude);
        },
        () => {
          console.log("GPS 허용을 거부했습니다.");
          setBg("bg-cloudy");
        }
    );
  }, []);

  const handleFeedButton = () => {
    router.push("/feed");
  };

  const handleLoginButton = () => {
    if (isLoggedIn) router.push("/mypage");
    else router.push("/login");
  };

  const handleLogoutButton = async () => {
    if (!isLoggedIn) return;

    const ok = confirm("로그아웃 하시겠습니까?");

    if (!ok) return;

    await auth.signOut();
    useAuthStore.getState().logout();
    alert("로그아웃 되었습니다.");
  }

  return (
      <div className="relative h-screen flex flex-col justify-between overflow-hidden">
        {/* 배경 이미지 + 오버레이 */}
        <div className={`absolute inset-0 ${bg} bg-cover bg-center`}>
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative flex pt-[50px] px-5 justify-between">
          <div className="flex-shrink-0">
            <div className="text-snow text-[16px] font-bold">현재 기온</div>
            <div className="flex flex-row items-start py-1">
              <div className="text-snow text-[128px] font-bold leading-[0.8]">
                {currTemp}
              </div>
              <div className="text-snow text-[36px] font-bold">℃</div>
            </div>
            <div className="text-snow text-[20px] font-bold pt-1">
              일 평균 {avgTemp}℃ · {avgWeather}
            </div>
          </div>
          <div className="flex flex-col gap-[13px] flex-shrink-0">
            <button onClick={handleFeedButton}>
              <img src="/Feed.png" alt="Feed" className="w-[40px] h-[40px]" />
            </button>
            <button onClick={handleLoginButton}>
              <img src="/User.png" alt="User" className="w-[40px] h-[40px]" />
            </button>
            {isLoggedIn && (
                <>
                  <NotificationBell />
                  <ChatIcon onClick={openChatList} />
                  <button onClick={handleLogoutButton}>
                    <img src="/Logout.svg" alt="Logout" className="w-[40px] h-[40px]" />
                  </button>
                </>
            )}
          </div>
        </div>

        <div className="relative px-5 pb-8">
          <div className="text-snow text-[20px] font-bold mb-4">
            오늘 같은 날씨에 많이 입는 옷
          </div>
          <Ratio loading={isLoading} avgTemp={avgTemp} />
        </div>
      </div>
  );
}