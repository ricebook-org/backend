import mongoose from "mongoose";

export interface UserSchema {
	username: string;
	email: string;
	password: string;
	otp: string;
	isVerified: boolean;
	token: string;
	profile_picture_path: string;
	createdAt: Date;
	updatedAt: Date;
	_id: mongoose.Schema.Types.ObjectId;
	id: string;
}

export interface PostSchema {
	title: string;
	id: string;
	_id: mongoose.Schema.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	user_id: string;
	description: string;
	image_path: string;
	grains: number;
	tags: string[];
}
