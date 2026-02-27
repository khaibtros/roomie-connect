import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFavorite extends Document {
  userId: Types.ObjectId;
  roomId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique constraint on (userId, roomId)
favoriteSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
