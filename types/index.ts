export interface BasePost {
  id: string;
  createdAt: string;
  photo: string;
  tempRange: string;
  likes: number;
}

export interface PostSummary extends BasePost {
  gender: string;
}

export interface PostDetail extends BasePost {
  post: string;
  member: {
    memberId: string;
    nickname: string;
    profilePhoto: string;
  };
  isLikedByMe: boolean;
}

export enum TempRange {
  BELOW_4 = "BELOW_4",
  FROM4_TO8 = "FROM4_TO8",
  FROM9_TO11 = "FROM9_TO11",
  FROM12_TO16 = "FROM12_TO16",
  FROM17_TO19 = "FROM17_TO19",
  FROM20_TO22 = "FROM20_TO22",
  FROM23_TO27 = "FROM23_TO27",
  OVER_28 = "OVER_28",
}

export const TEMP_RANGE_LIST: TempRange[] = [
  TempRange.BELOW_4,
  TempRange.FROM4_TO8,
  TempRange.FROM9_TO11,
  TempRange.FROM12_TO16,
  TempRange.FROM17_TO19,
  TempRange.FROM20_TO22,
  TempRange.FROM23_TO27,
  TempRange.OVER_28,
];

export enum Gender {
  FEMALE = "FEMALE",
  MALE = "MALE",
  NO_SELECT = "NO_SELECT"
}

export const GENDER_LIST: Gender[] = [
  Gender.FEMALE,
  Gender.MALE,
  Gender.NO_SELECT
];

export interface Region {
  name: string;
  latitude: number;
  longitude: number;
}

export const REGIONS: Region[] = [
  { name: "서울", latitude: 37.5665, longitude: 126.9780 },
  { name: "인천", latitude: 37.4563, longitude: 126.7052 },
  { name: "경기북부", latitude: 37.7519, longitude: 127.0777 },
  { name: "경기남부", latitude: 37.2636, longitude: 127.0286 },
  { name: "대전", latitude: 36.3504, longitude: 127.3845 },
  { name: "충청북도", latitude: 36.6357, longitude: 127.4914 },
  { name: "충청남도", latitude: 36.5184, longitude: 126.8000 },
  { name: "광주", latitude: 35.1595, longitude: 126.8526 },
  { name: "전라북도", latitude: 35.7175, longitude: 127.1530 },
  { name: "전라남도", latitude: 34.8679, longitude: 126.9910 },
  { name: "대구", latitude: 35.8714, longitude: 128.6014 },
  { name: "부산", latitude: 35.1796, longitude: 129.0756 },
  { name: "경상북도", latitude: 36.4919, longitude: 128.8889 },
  { name: "경상남도", latitude: 35.4606, longitude: 128.2132 },
  { name: "강원", latitude: 37.8228, longitude: 128.1555 },
  { name: "제주", latitude: 33.4996, longitude: 126.5312 },
];

export const getRegionCoords = (regionName: string) => {
  const region = REGIONS.find((r) => r.name === regionName);
  return region ? { lat: region.latitude, lon: region.longitude } : null;
};