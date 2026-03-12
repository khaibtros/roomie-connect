import mongoose, { Document, Schema } from 'mongoose';

export interface ICoinTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  packageType: 'basic' | 'standard' | 'premium';
  amount: number;
  coinAmount: number;
  status: 'pending' | 'success' | 'cancelled' | 'failed';
  orderCode: number;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const coinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    packageType: { 
      type: String, 
      enum: ['basic', 'standard', 'premium'], 
      required: true 
    },
    amount: { type: Number, required: true },
    coinAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'cancelled', 'failed'],
      default: 'pending'
    },
    orderCode: { type: Number, required: true, unique: true },
    paymentId: { type: String }
  },
  { timestamps: true }
);

export const CoinTransaction = mongoose.model<ICoinTransaction>('CoinTransaction', coinTransactionSchema);
