import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'admin' | 'branch_manager' | 'user';
  name?: string;
  branches: mongoose.Types.ObjectId[];
  defaultBranch?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  _id : {
    type: mongoose.Schema.Types.ObjectId, 
    auto: true 
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'branch_manager', 'user', 'cashier'],
    default: 'user',
  },
  name: String,
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  defaultBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
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
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);