import { model, Schema } from "mongoose";
import { User } from "../../MonType";
import bcrypt from "bcrypt";

const userSchema = new Schema<User>({
	username: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
});

userSchema.pre("save", function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	this.password = bcrypt.hashSync(this.password, 8);
	next();
});

export default model<User>("User", userSchema, "Users");
