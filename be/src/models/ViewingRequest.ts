import mongoose, { Document, Schema, Types } from "mongoose";

// ---------------------------------------------------------------------------
// Viewing Status & Decision
// ---------------------------------------------------------------------------
export type ViewingStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "completed"
  | "failed";

export type DecisionStatus = "confirmed" | "rejected";

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface IPayment extends Document {
  viewingId: Types.ObjectId;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    viewingId: {
      type: Schema.Types.ObjectId,
      ref: "ViewingRequest",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);

// ---------------------------------------------------------------------------
// Refund Request
// ---------------------------------------------------------------------------
export type RefundStatus = "pending" | "approved" | "rejected";

export interface IRefundRequest extends Document {
  viewingId: Types.ObjectId;
  paymentId: Types.ObjectId;
  status: RefundStatus;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    viewingId: {
      type: Schema.Types.ObjectId,
      ref: "ViewingRequest",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: { type: String, required: true },
  },
  { timestamps: true },
);

export const RefundRequest = mongoose.model<IRefundRequest>(
  "RefundRequest",
  refundRequestSchema,
);

// ---------------------------------------------------------------------------
// Room Info (embedded)
// ---------------------------------------------------------------------------
export interface IRoomInfo {
  roomId: Types.ObjectId;
  title: string;
  address: string;
  district: string;
  price: number;
  deposit?: number;
}

const roomInfoSchema = new Schema<IRoomInfo>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    title: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true },
    price: { type: Number, required: true },
    deposit: Number,
  },
  { _id: false },
);

// ---------------------------------------------------------------------------
// Viewing Request
// ---------------------------------------------------------------------------
export interface IViewingRequest extends Document {
  tenantId: Types.ObjectId;
  landlordId: Types.ObjectId;
  roomId: Types.ObjectId;
  scheduledTime: Date;
  roomInfo: IRoomInfo;
  status: ViewingStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const viewingRequestSchema = new Schema<IViewingRequest>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    landlordId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    scheduledTime: { type: Date, required: true },
    roomInfo: { type: roomInfoSchema, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_payment",
        "confirmed",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: undefined },
  },
  { timestamps: true },
);

viewingRequestSchema.index({ landlordId: 1, status: 1 });
viewingRequestSchema.index({ roomId: 1, status: 1 });
viewingRequestSchema.index({ tenantId: 1, status: 1 });

export const ViewingRequest = mongoose.model<IViewingRequest>(
  "ViewingRequest",
  viewingRequestSchema,
);

// ---------------------------------------------------------------------------
// Viewing Decision
// ---------------------------------------------------------------------------
export interface IViewingDecision extends Document {
  viewingId: Types.ObjectId;
  tenantDecision: DecisionStatus | null;
  landlordDecision: DecisionStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

const viewingDecisionSchema = new Schema<IViewingDecision>(
  {
    viewingId: {
      type: Schema.Types.ObjectId,
      ref: "ViewingRequest",
      required: true,
      unique: true,
      index: true,
    },
    tenantDecision: {
      type: String,
      enum: ["confirmed", "rejected", null],
      default: null,
    },
    landlordDecision: {
      type: String,
      enum: ["confirmed", "rejected", null],
      default: null,
    },
  },
  { timestamps: true },
);

export const ViewingDecision = mongoose.model<IViewingDecision>(
  "ViewingDecision",
  viewingDecisionSchema,
);
