import mongoose, { Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>('Branch', branchSchema);