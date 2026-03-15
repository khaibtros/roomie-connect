import mongoose, { Document, Schema } from "mongoose";

/**
 * AI Usage Log — tracks every AI chat interaction.
 * Stores the user's prompt, AI response, and metadata.
 */
export interface IAiUsage extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  response: string;
  tokensUsed: number;
  /** Classified intent for this turn */
  intent?: string;
  /** Whether the LLM was invoked (false = DB-only or static fallback) */
  llmUsed?: boolean;
  /** Response type for observability: DB | LLM | FALLBACK | OUT_OF_SCOPE | CLARIFICATION | SYSTEM_ERROR */
  responseType?: string;
  /** Snapshot of room documents returned for this query (used to restore history UI) */
  roomResults?: Record<string, unknown>[];
  /** Snapshot of roommate profiles returned for this query */
  roommateResults?: Record<string, unknown>[];
  /** Structured comparison payload returned for COMPARE_ROOMS intent */
  compareResults?: Record<string, unknown>[];
  createdAt: Date;
}

const aiUsageSchema = new Schema<IAiUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 1,
    },
    intent: { type: String },
    llmUsed: { type: Boolean },
    responseType: { type: String },
    // Stored as mixed so we can snapshot any room shape without coupling to Room schema
    roomResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
    roommateResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
    // Structured comparison payload for COMPARE_ROOMS intent
    compareResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

// Index for querying usage history efficiently
aiUsageSchema.index({ userId: 1, createdAt: -1 });

export const AiUsage = mongoose.model<IAiUsage>("AiUsage", aiUsageSchema);
