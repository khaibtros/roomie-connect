import mongoose, { Document, Schema, Types } from "mongoose";

export type SubscriptionPackage = "monthly" | "six_month" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface ISubscription extends Document {
  landlordId: Types.ObjectId;
  packageType: SubscriptionPackage;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  amount: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    landlordId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    packageType: {
      type: String,
      enum: ["monthly", "six_month", "yearly"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
subscriptionSchema.index({ landlordId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Helper method to check if subscription is currently active
subscriptionSchema.methods.isActive = function () {
  return this.status === "active" && new Date() < this.endDate;
};

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
