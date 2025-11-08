import mongoose, { Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new mongoose.Schema({
  _id : {
    type: mongoose.Schema.Types.ObjectId, 
    auto: true 
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if the model exists before creating a new one
export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);