export interface QuizAnswer {
  questionId: number;
  selectedOption: string;
  dimension?: string;
  firstPoleScore?: number;
  secondPoleScore?: number;
  conflictScore?: number;
}

export interface PersonalityScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

export interface DimensionStrength {
  E_I: "strong" | "light" | "balanced";
  S_N: "strong" | "light" | "balanced";
  T_F: "strong" | "light" | "balanced";
  J_P: "strong" | "light" | "balanced";
}

export interface ConflictProfile {
  type: "DIRECT" | "BALANCED_FLEXIBLE" | "NEEDS_SPACE";
  title: string;
  description: string;
}

export interface QuizResults {
  quizAnswers: QuizAnswer[];
  personalityScores: PersonalityScores;
  personalityType: string;
  dimensionStrength?: DimensionStrength;
  conflictScore?: number;
  conflictProfile?: ConflictProfile;
  lifestyleTags?: string[]; // Kept for backward compatibility
  quizCompletedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  age: number;
  university: string;
  major: string;
  year: number;
  bio: string;
  preferences?: QuizResults;
  zaloId?: string;
  verified: boolean;
}

export interface RoomUtilities {
  electricity: number; // VND per kWh
  water: number | string; // VND per m3 or "100k/người"
  internet: number; // VND per month
  cleaning: number | string; // VND per month or "Miễn phí"
  parking: number | string; // VND per month or "Miễn phí"
}

export interface RoomOwner {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  verified: boolean;
  responseRate?: number;
  facebookUrl?: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  deposit: number;
  area: number;
  maxOccupants: number;
  floor: number;
  roomType: "studio" | "shared" | "single" | "apartment";
  address: string;
  district: "Thạch Hòa" | "Tân Xã" | "Bình Yên" | "Thạch Thất";
  amenities?: string[];
  nearbyPlaces?: string[];
  utilities: RoomUtilities;
  owner: RoomOwner;
  status: "available" | "rented" | "pending";
  postedAt: Date;
  updatedAt: Date;
  views: number;
}

export interface MatchResult {
  user: User;
  score: number;
  matchingTraits: string[];
}
