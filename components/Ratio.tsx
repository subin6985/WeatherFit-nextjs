"use client";

import { useEffect, useState } from "react";

type RatioItem = {
  category: string;
  ratio: number; // 0~1
};

type RatioResponse = {
  top: RatioItem[];
  bottom: RatioItem[];
};

// 더미 데이터
const MOCK_DATA: RatioResponse = {
  top: [
    { category: "반소매", ratio: 0.6 },
    { category: "긴소매", ratio: 0.2 },
  ],
  bottom: [
    { category: "긴바지", ratio: 0.8 },
    { category: "반바지", ratio: 0.15 },
  ],
};

// Mock 사용 여부 (true면 API 안 쓰고 더미만 사용)
const USE_MOCK = true;

export default function Ratio() {
  const [filter, setFilter] = useState<"all" | "female" | "male">("all");
  const [data, setData] = useState<RatioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRatioData(filter);
  }, [filter]);

  const fetchRatioData = async (gender: string) => {
    setIsLoading(true);

    if (USE_MOCK) {
      // Mock 데이터 사용 시 약간의 딜레이로 실제 API 느낌 연출
      setTimeout(() => {
        setData(MOCK_DATA);
        setIsLoading(false);
      }, 300);
      return;
    }

    try {
      const res = await fetch(`/api/ratio?gender=${gender}`);

      if (!res.ok) throw new Error("Failed to fetch ratio data");

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("비율 데이터 로딩 실패:", error);
      // 에러 시 Mock 데이터 사용
      setData(MOCK_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBar = (item: RatioItem, active: boolean) => (
      <div
          className="flex items-center w-[285px] text-snow mb-2"
          key={item.category}
      >
      <span
          className={`w-[70px] ${
              active ? "text-point font-semibold" : "text-snow"
          }`}
      >
        {item.category}
      </span>

        {/* Bar */}
        <div className="flex-1 mx-[25px]">
          <div
              className={`h-[6px] rounded-full ${
                  active ? "bg-point" : "bg-snow"
              }`}
              style={{ width: `${item.ratio * 100}%` }}
          />
        </div>

        <span className={active ? "text-point font-semibold" : "text-snow"}>
        {Math.round(item.ratio * 100)}%
      </span>
      </div>
  );

  if (isLoading || !data) {
    return <div className="text-snow mt-4">Loading...</div>;
  }

  const topMax = data.top.reduce((prev, cur) =>
      cur.ratio > prev.ratio ? cur : prev
  );
  const bottomMax = data.bottom.reduce((prev, cur) =>
      cur.ratio > prev.ratio ? cur : prev
  );

  return (
      <div className="w-[353px] mt-2 text-snow">
        {/* 필터 버튼 */}
        <div className="flex bg-snow/30 rounded-full p-1 mb-4">
          {(["all", "female", "male"] as const).map((g) => (
              <button
                  key={g}
                  onClick={() => setFilter(g)}
                  className={`flex-1 py-1 rounded-full transition-colors ${
                      filter === g
                          ? "bg-snow text-base font-semibold"
                          : "text-snow hover:bg-snow/10"
                  }`}
              >
                {g === "all" ? "모두가" : g === "female" ? "여성이" : "남성이"}
              </button>
          ))}
        </div>

        {/* 상의 */}
        <div className="flex flex-row mb-[24px]">
          <div className="text-[20px] font-semibold mr-[25px]">상의</div>
          <div className="flex-col text-[20px]">
            {data.top.map((item) =>
                renderBar(item, item.category === topMax.category)
            )}
          </div>
        </div>

        {/* 하의 */}
        <div className="flex flex-row">
          <div className="text-[20px] font-semibold mr-[25px]">하의</div>
          <div className="flex-col text-[20px]">
            {data.bottom.map((item) =>
                renderBar(item, item.category === bottomMax.category)
            )}
          </div>
        </div>
      </div>
  );
}