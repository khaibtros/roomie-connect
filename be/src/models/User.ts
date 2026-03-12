import mongoose, { Document, Schema } from "mongoose";

// Enums matching Supabase
export type AppRole = "admin" | "landlord" | "tenant";

export interface IAiTokens {
  tokens: number;
  maxTokens: number;
}

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  university?: string;
  workplace?: string;
  bankName?: string;
  bankAccount?: string;
  isVerified: boolean;
  isBanned: boolean;
  role: AppRole;
  aiTokens: IAiTokens;
  knockCoin: number;
  unlockedRoommateUserIds: mongoose.Types.ObjectId[];
  /** Persistent counter of free AI chats used. Never decremented, even if chat history is cleared. */
  aiFreeChatUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiTokensSchema = new Schema<IAiTokens>(
  {
    tokens: { type: Number, default: 0 },
    maxTokens: { type: Number, default: Infinity },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: { type: String },
    phone: { type: String },
    university: { type: String },
    workplace: { type: String },
    bankName: { type: String },
    bankAccount: { type: String },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["admin", "landlord", "tenant"],
      default: "tenant",
    },
    aiTokens: {
      type: aiTokensSchema,
      default: () => ({ tokens: 0, maxTokens: Infinity }),
    },
    knockCoin: { type: Number, default: 0 },
    unlockedRoommateUserIds: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    aiFreeChatUsed: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
