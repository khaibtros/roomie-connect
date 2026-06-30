import mongoose, { Document, Schema, Types } from "mongoose";

export interface IQuizAnswer {
  questionId: number;
  selectedOption: string;
  dimension?: string;
  firstPoleScore?: number;
  secondPoleScore?: number;
  conflictScore?: number;
  trait?: string; // legacy
  lifestyleTag?: string; // legacy
}

export interface IPersonalityScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

export interface IDimensionStrength {
  E_I: "strong" | "light" | "balanced";
  S_N: "strong" | "light" | "balanced";
  T_F: "strong" | "light" | "balanced";
  J_P: "strong" | "light" | "balanced";
}

export interface IConflictProfile {
  type: "DIRECT" | "BALANCED_FLEXIBLE" | "NEEDS_SPACE";
  title: string;
  description: string;
}

export interface IQuizResults {
  quizAnswers: IQuizAnswer[];
  personalityScores: IPersonalityScores;
  personalityType: string;
  dimensionStrength?: IDimensionStrength;
  conflictScore?: number;
  conflictProfile?: IConflictProfile;
  lifestyleTags?: string[]; // Kept for backward compatibility
  quizCompletedAt?: Date;
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
  // Quiz results
  preferences?: IQuizResults;
  createdAt: Date;
  updatedAt: Date;
}

const quizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionId: { type: Number, required: true },
    selectedOption: { type: String, required: true },
    dimension: { type: String },
    firstPoleScore: { type: Number },
    secondPoleScore: { type: Number },
    conflictScore: { type: Number },
    trait: { type: String },
    lifestyleTag: { type: String },
  },
  { _id: false },
);

const personalityScoresSchema = new Schema<IPersonalityScores>(
  {
    E: { type: Number, default: 0 },
    I: { type: Number, default: 0 },
    S: { type: Number, default: 0 },
    N: { type: Number, default: 0 },
    T: { type: Number, default: 0 },
    F: { type: Number, default: 0 },
    J: { type: Number, default: 0 },
    P: { type: Number, default: 0 },
  },
  { _id: false },
);

const dimensionStrengthSchema = new Schema<IDimensionStrength>(
  {
    E_I: { type: String, enum: ["strong", "light", "balanced"] },
    S_N: { type: String, enum: ["strong", "light", "balanced"] },
    T_F: { type: String, enum: ["strong", "light", "balanced"] },
    J_P: { type: String, enum: ["strong", "light", "balanced"] },
  },
  { _id: false },
);

const conflictProfileSchema = new Schema<IConflictProfile>(
  {
    type: { type: String, enum: ["DIRECT", "BALANCED_FLEXIBLE", "NEEDS_SPACE"] },
    title: { type: String },
    description: { type: String },
  },
  { _id: false },
);

const quizResultsSchema = new Schema<IQuizResults>(
  {
    quizAnswers: { type: [quizAnswerSchema], default: [] },
    personalityScores: { type: personalityScoresSchema, default: () => ({}) },
    personalityType: { type: String },
    dimensionStrength: { type: dimensionStrengthSchema },
    conflictScore: { type: Number },
    conflictProfile: { type: conflictProfileSchema },
    lifestyleTags: { type: [String], default: [] },
    quizCompletedAt: { type: Date },
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
    preferences: { type: quizResultsSchema },
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
