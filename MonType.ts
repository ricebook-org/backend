import mongoose from 'mongoose';

export interface UserSchema {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Schema.Types.ObjectId;
  id: string;
};
