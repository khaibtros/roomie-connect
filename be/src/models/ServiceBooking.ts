import mongoose, { Document, Schema } from "mongoose";

export interface IMovingDetails {
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: "motorbike" | "three_wheeler" | "small_truck";
  floorNumber?: number;
  hasElevator?: boolean;
  itemDescription?: string;
}

export interface ICleaningDetails {
  address: string;
  roomSizePackage: "small" | "medium" | "large";
  estimatedArea?: number;
  cleaningType?: "basic" | "deep_cleaning";
}

export interface IServiceBooking extends Document {
  tenant: mongoose.Types.ObjectId;
  serviceType: "moving" | "cleaning";
  serviceDate: Date;
  contactName: string;
  contactPhone: string;
  estimatedPrice: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
  note?: string;
  adminNote?: string;
  paymentMethod?: "cash" | "bank_transfer" | "wallet";
  paymentStatus?: "unpaid" | "paid" | "refunded";
  movingDetails?: IMovingDetails;
  cleaningDetails?: ICleaningDetails;
  createdAt: Date;
  updatedAt: Date;
}

const movingDetailsSchema = new Schema<IMovingDetails>(
  {
    pickupAddress: { type: String, required: true },
    dropoffAddress: { type: String, required: true },
    vehicleType: { type: String, enum: ["motorbike", "three_wheeler", "small_truck"], required: true },
    floorNumber: { type: Number },
    hasElevator: { type: Boolean, default: false },
    itemDescription: { type: String },
  },
  { _id: false }
);

const cleaningDetailsSchema = new Schema<ICleaningDetails>(
  {
    address: { type: String, required: true },
    roomSizePackage: { type: String, enum: ["small", "medium", "large"], required: true },
    estimatedArea: { type: Number },
    cleaningType: { type: String, enum: ["basic", "deep_cleaning"], default: "basic" },
  },
  { _id: false }
);

const serviceBookingSchema = new Schema<IServiceBooking>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceType: { type: String, enum: ["moving", "cleaning"], required: true },
    serviceDate: { type: Date, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    estimatedPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    note: { type: String },
    adminNote: { type: String },
    paymentMethod: { type: String, enum: ["cash", "bank_transfer", "wallet"], default: "cash" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    movingDetails: { type: movingDetailsSchema },
    cleaningDetails: { type: cleaningDetailsSchema },
  },
  { timestamps: true }
);

export const ServiceBooking = mongoose.model<IServiceBooking>("ServiceBooking", serviceBookingSchema);
