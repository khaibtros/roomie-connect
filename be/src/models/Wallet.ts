import mongoose, { Document, Schema, Types } from "mongoose";

// Transaction types matching Supabase
export type TransactionType =
  | "topup"
  | "post_fee"
  | "subscription"
  | "token_purchase";

export interface ITransaction {
  type: TransactionType;
  amount: number;
  description?: string;
  referenceId?: string;
  createdAt: Date;
}

export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ["topup", "post_fee", "subscription", "token_purchase"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String },
    referenceId: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema],
  },
  {
    timestamps: true,
  },
);

export const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
