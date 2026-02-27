import mongoose, { Document, Schema } from "mongoose";

/**
 * AI Usage Log — tracks every AI chat interaction.
 * Stores the user's prompt, Gemini's response, and metadata.
 */
export interface IAiUsage extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  response: string;
  tokensUsed: number;
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
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

// Index for querying usage history efficiently
aiUsageSchema.index({ userId: 1, createdAt: -1 });

export const AiUsage = mongoose.model<IAiUsage>("AiUsage", aiUsageSchema);
