// lib/weatherUtils.ts
import { TempRange } from "../types";

// 온도를 TempRange enum으로 변환
export const tempToTempRange = (temp: number): TempRange => {
  if (temp < 4) return TempRange.BELOW_4;
  if (temp >= 4 && temp <= 8) return TempRange.FROM4_TO8;
  if (temp >= 9 && temp <= 11) return TempRange.FROM9_TO11;
  if (temp >= 12 && temp <= 16) return TempRange.FROM12_TO16;
  if (temp >= 17 && temp <= 19) return TempRange.FROM17_TO19;
  if (temp >= 20 && temp <= 22) return TempRange.FROM20_TO22;
  if (temp >= 23 && temp <= 27) return TempRange.FROM23_TO27;
  return TempRange.OVER_28;
};

// 특정 날짜와 위치의 날씨 정보 가져오기
export const fetchWeatherForDate = async (
    lat: number,
    lon: number,
    date: Date
): Promise<{ temp: number; tempRange: TempRange } | null> => {
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

  if (!API_KEY) {
    console.error("Weather API key not found");
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Weather API error");

    const data = await res.json();

    // 오늘 날짜와 선택한 날짜 비교
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
        (selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let temp: number;

    if (daysDiff === 0) {
      // 오늘: 현재 온도 사용
      temp = Math.round(data.current.temp);
    } else if (daysDiff > 0 && daysDiff <= 7) {
      // 1~7일 후: 예보 데이터 사용
      temp = Math.round(data.daily[daysDiff].temp.day);
    } else if (daysDiff < 0 && daysDiff >= -5) {
      // 과거 5일 이내: hourly 데이터에서 추정 (제한적)
      // OpenWeather API는 과거 데이터를 제공하지 않으므로 현재 온도로 대체
      temp = Math.round(data.current.temp);
    } else {
      // 범위 밖: 현재 온도 사용
      temp = Math.round(data.current.temp);
    }

    const tempRange = tempToTempRange(temp);

    return { temp, tempRange };
  } catch (error) {
    console.error("날씨 정보를 가져오는데 실패했습니다:", error);
    return null;
  }
};

// TempRange를 표시용 문자열로 변환
export const tempRangeToString = (range: TempRange): string => {
  const map: Record<TempRange, string> = {
    [TempRange.BELOW_4]: "4도 이하",
    [TempRange.FROM4_TO8]: "4~8도",
    [TempRange.FROM9_TO11]: "9~11도",
    [TempRange.FROM12_TO16]: "12~16도",
    [TempRange.FROM17_TO19]: "17~19도",
    [TempRange.FROM20_TO22]: "20~22도",
    [TempRange.FROM23_TO27]: "23~27도",
    [TempRange.OVER_28]: "28도 이상",
  };
  return map[range];
};