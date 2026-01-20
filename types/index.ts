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