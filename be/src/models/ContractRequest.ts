import mongoose, { Document, Schema, Types } from "mongoose";

export type ContractRequestStatus = "pending" | "approved" | "rejected";

export interface ITenantInfo {
  tenantId: Types.ObjectId;
  email: string;
  fullName: string;
  phone?: string;
  university?: string;
}

export interface IRoomInfo {
  roomId: Types.ObjectId;
  title: string;
  address: string;
  district: string;
  price: number;
  deposit?: number;
}

export interface IContractRequest extends Document {
  tenantId: Types.ObjectId;
  landlordId: Types.ObjectId;
  roomId: Types.ObjectId;
  tenantInfo: ITenantInfo;
  roomInfo: IRoomInfo;
  status: ContractRequestStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantInfoSchema = new Schema<ITenantInfo>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: String,
    university: String,
  },
  { _id: false },
);

const roomInfoSchema = new Schema<IRoomInfo>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    deposit: Number,
  },
  { _id: false },
);

const contractRequestSchema = new Schema<IContractRequest>(
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
    tenantInfo: {
      type: tenantInfoSchema,
      required: true,
    },
    roomInfo: {
      type: roomInfoSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: String,
  },
  {
    timestamps: true,
  },
);

// Compound index for landlord and room queries
contractRequestSchema.index({ landlordId: 1, status: 1 });
contractRequestSchema.index({ roomId: 1, status: 1 });
contractRequestSchema.index({ tenantId: 1, status: 1 });

export const ContractRequest = mongoose.model<IContractRequest>(
  "ContractRequest",
  contractRequestSchema,
);
