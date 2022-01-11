import { model, Schema } from "mongoose";
import { UserSchema } from "../../MonType";
import bcrypt from "bcrypt";

const UserSchema = new Schema<UserSchema>(
	{
		username: { type: String, required: true },
		email: { type: String, required: true },
		password: { type: String, required: true },
		otp: { type: String, required: true },
		isVerified: { type: Boolean, default: false },
		token: { type: String },
		// todo: default to some default profile picture path
		propicPath: { type: String, required: true },
	},
	{
		timestamps: true,
		_id: true,
		id: true,
	}
);

UserSchema.pre("save", function (next) {
	if (!this.isModified("password")) return next();

	this.password = bcrypt.hashSync(this.password, 8);
	next();
});

export default model<UserSchema>("User", UserSchema, "user");
