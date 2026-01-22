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

// Open-Meteo로 특정 날짜와 위치의 날씨 정보 가져오기
export const fetchWeatherForDate = async (
    lat: number,
    lon: number,
    date: Date
): Promise<{ temp: number; tempRange: TempRange } | null> => {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);

    const dateStr = date.toISOString().split('T')[0];
    let url: string;

    if (date < twoDaysAgo) {
      // 과거 데이터: Archive API
      url = `https://archive-api.open-meteo.com/v1/archive` +
          `?latitude=${lat}&longitude=${lon}` +
          `&start_date=${dateStr}&end_date=${dateStr}` +
          `&daily=temperature_2m_mean` +
          `&timezone=Asia/Seoul`;
    } else {
      // 현재/미래: Forecast API
      url = `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lon}` +
          `&daily=temperature_2m_mean` +
          `&past_days=2` +
          `&forecast_days=7` +
          `&timezone=Asia/Seoul`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API error");

    const data = await response.json();

    let temp: number;

    if (date < twoDaysAgo) {
      temp = Math.round(data.daily.temperature_2m_mean[0]);
    } else {
      const index = data.daily.time.indexOf(dateStr);
      if (index === -1) {
        throw new Error("Date not found in forecast");
      }
      temp = Math.round(data.daily.temperature_2m_mean[index]);
    }

    const tempRange = tempToTempRange(temp);

    return { temp, tempRange };
  } catch (error) {
    console.error("날씨 정보를 가져오는데 실패했습니다:", error);
    return null;
  }
};