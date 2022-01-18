import mongoose from 'mongoose';

export interface PostSchema {
  title: string;
  userId: string;
  description: string;
  imagePaths: string[];
  grainedBy: mongoose.Schema.Types.ObjectId[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Schema.Types.ObjectId;
  id: string;
};

export interface UserSchema {
  username: string;
  email: string;
  password: string;
  otp: string;
  isVerified: boolean;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  _id: mongoose.Schema.Types.ObjectId;
  id: string;
};
