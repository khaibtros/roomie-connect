import mongoose, { Document, Schema, Types } from "mongoose";

// Quiz preferences matching frontend QuizPreferences type
export interface IQuizPreferences {
  // Phần 1: Giờ giấc & Thói quen ngủ
  sleepTime?: "early" | "late" | "poor_sleep" | "flexible";
  sleepNoise?:
    | "very_sensitive"
    | "somewhat_sensitive"
    | "easy_sleep"
    | "very_deep";
  alarmClock?: "immediate" | "snooze" | "many_alarms" | "no_alarm";
  nap?: "must_nap" | "sometimes_nap" | "rarely_nap" | "never_nap";
  sleepHabits?: "snore_grind" | "talk" | "sprawl" | "clean_sleep";
  // Phần 2: Vệ sinh & Ngăn nắp
  roomCleaning?: "daily" | "weekly" | "when_messy" | "rarely";
  dishWashing?: "immediately" | "end_of_day" | "delayed" | "eat_out";
  trash?: "daily" | "full" | "smell" | "anywhere";
  organization?:
    | "very_organized"
    | "mostly_organized"
    | "organized_chaos"
    | "very_messy";
  sharedBathroom?:
    | "schedule"
    | "self_initiative"
    | "paid_cleaning"
    | "reluctant";
  pets?: "have_pet" | "like_pet" | "allergic" | "indifferent";
  // Phần 3: Khách khứa & Riêng tư
  guests?: "often" | "sometimes" | "rarely" | "never";
  oppositeGender?: "comfortable" | "with_notice" | "visit_only" | "not_allowed";
  studyTime?: "morning" | "afternoon" | "evening_night" | "anytime_or_cafe";
  dressing?: "formal" | "casual" | "minimal" | "mood";
  speaker?: "often" | "sometimes" | "headphones" | "no_media";
  // Phần 4: Tài chính & Sử dụng đồ chung
  utilities?: "equal" | "by_usage" | "separate_meter" | "all_in_rent";
  sharedItems?: "share_all" | "strictly_separate" | "ask_first" | "share_some";
  rentPayment?: "on_time" | "slightly_late" | "forgetful" | "often_late";
  cookingHabit?: "cook_daily" | "cook_simple" | "eat_out" | "cook_together";
  // Phần 5: Tính cách & Lối sống
  socialHabit?: "extrovert" | "introvert" | "ambivert" | "reserved";
  smoking?: "smoke_indoors" | "smoke_outdoors" | "no_smoke_ok" | "hate_smoke";
  acFan?: "ac_always_cold" | "ac_moderate" | "ac_timer" | "fan_only";
  conflictStyle?: "direct" | "message" | "silent" | "tell_others";
  alcohol?:
    | "often_drink"
    | "sometimes_drink"
    | "never_drink_home"
    | "cant_drink";
  // Phần 6: Câu hỏi mở rộng
  priority?: "cleanliness" | "financial" | "personality" | "privacy";
  genderPreference?: "male" | "female" | "lgbtq" | "no_preference";
  budget?: "under_1.5m" | "1.5_2.5m" | "2.5_4m" | "over_4m";
  location?: "near_school" | "flexible_location" | "downtown" | "quiet_area";
  duration?: "short_term" | "medium_term" | "long_term" | "very_long_term";
}

export interface IRoommateProfile extends Document {
  userId: Types.ObjectId;
  bio?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredDistrict: string[];
  university?: string;
  lookingFor?: string;
  isPublic: boolean;
  // Quiz preferences
  preferences: IQuizPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const quizPreferencesSchema = new Schema<IQuizPreferences>(
  {
    // All fields optional with enum validation
    sleepTime: {
      type: String,
      enum: ["early", "late", "poor_sleep", "flexible"],
    },
    sleepNoise: {
      type: String,
      enum: ["very_sensitive", "somewhat_sensitive", "easy_sleep", "very_deep"],
    },
    alarmClock: {
      type: String,
      enum: ["immediate", "snooze", "many_alarms", "no_alarm"],
    },
    nap: {
      type: String,
      enum: ["must_nap", "sometimes_nap", "rarely_nap", "never_nap"],
    },
    sleepHabits: {
      type: String,
      enum: ["snore_grind", "talk", "sprawl", "clean_sleep"],
    },
    roomCleaning: {
      type: String,
      enum: ["daily", "weekly", "when_messy", "rarely"],
    },
    dishWashing: {
      type: String,
      enum: ["immediately", "end_of_day", "delayed", "eat_out"],
    },
    trash: { type: String, enum: ["daily", "full", "smell", "anywhere"] },
    organization: {
      type: String,
      enum: [
        "very_organized",
        "mostly_organized",
        "organized_chaos",
        "very_messy",
      ],
    },
    sharedBathroom: {
      type: String,
      enum: ["schedule", "self_initiative", "paid_cleaning", "reluctant"],
    },
    pets: {
      type: String,
      enum: ["have_pet", "like_pet", "allergic", "indifferent"],
    },
    guests: { type: String, enum: ["often", "sometimes", "rarely", "never"] },
    oppositeGender: {
      type: String,
      enum: ["comfortable", "with_notice", "visit_only", "not_allowed"],
    },
    studyTime: {
      type: String,
      enum: ["morning", "afternoon", "evening_night", "anytime_or_cafe"],
    },
    dressing: { type: String, enum: ["formal", "casual", "minimal", "mood"] },
    speaker: {
      type: String,
      enum: ["often", "sometimes", "headphones", "no_media"],
    },
    utilities: {
      type: String,
      enum: ["equal", "by_usage", "separate_meter", "all_in_rent"],
    },
    sharedItems: {
      type: String,
      enum: ["share_all", "strictly_separate", "ask_first", "share_some"],
    },
    rentPayment: {
      type: String,
      enum: ["on_time", "slightly_late", "forgetful", "often_late"],
    },
    cookingHabit: {
      type: String,
      enum: ["cook_daily", "cook_simple", "eat_out", "cook_together"],
    },
    socialHabit: {
      type: String,
      enum: ["extrovert", "introvert", "ambivert", "reserved"],
    },
    smoking: {
      type: String,
      enum: ["smoke_indoors", "smoke_outdoors", "no_smoke_ok", "hate_smoke"],
    },
    acFan: {
      type: String,
      enum: ["ac_always_cold", "ac_moderate", "ac_timer", "fan_only"],
    },
    conflictStyle: {
      type: String,
      enum: ["direct", "message", "silent", "tell_others"],
    },
    alcohol: {
      type: String,
      enum: [
        "often_drink",
        "sometimes_drink",
        "never_drink_home",
        "cant_drink",
      ],
    },
    priority: {
      type: String,
      enum: ["cleanliness", "financial", "personality", "privacy"],
    },
    genderPreference: {
      type: String,
      enum: ["male", "female", "lgbtq", "no_preference"],
    },
    budget: {
      type: String,
      enum: ["under_1.5m", "1.5_2.5m", "2.5_4m", "over_4m"],
    },
    location: {
      type: String,
      enum: ["near_school", "flexible_location", "downtown", "quiet_area"],
    },
    duration: {
      type: String,
      enum: ["short_term", "medium_term", "long_term", "very_long_term"],
    },
  },
  { _id: false },
);

const roommateProfileSchema = new Schema<IRoommateProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String },
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    preferredDistrict: [{ type: String }],
    university: { type: String },
    lookingFor: { type: String },
    isPublic: { type: Boolean, default: true },
    preferences: { type: quizPreferencesSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  },
);

roommateProfileSchema.index({ isPublic: 1 });

export const RoommateProfile = mongoose.model<IRoommateProfile>(
  "RoommateProfile",
  roommateProfileSchema,
);
