import { NextRequest, NextResponse } from "next/server";

type RatioItem = {
  category: string;
  ratio: number;
};

type RatioResponse = {
  top: RatioItem[];
  bottom: RatioItem[];
};

// 실제 백엔드 API URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gender = searchParams.get("gender") || "all";

  try {
    // 실제 백엔드 API 호출
    const response = await fetch(
        `${BACKEND_API_URL}/api/ratio?gender=${gender}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          // Next.js 캐싱 설정 (옵션)
          next: { revalidate: 300 }, // 5분마다 재검증
        }
    );

    if (!response.ok) {
      throw new Error("Backend API error");
    }

    const data: RatioResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route Error:", error);

    // 에러 시 기본 데이터 반환
    return NextResponse.json(
        {
          top: [
            { category: "반소매", ratio: 0.6 },
            { category: "긴소매", ratio: 0.2 },
          ],
          bottom: [
            { category: "긴바지", ratio: 0.8 },
            { category: "반바지", ratio: 0.15 },
          ],
        },
        { status: 200 }
    );
  }
}