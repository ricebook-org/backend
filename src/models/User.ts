import { model, Schema } from "mongoose";
import { User } from "../../MonType";

const userSchema: Schema<User> = new Schema<User>({
	username: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
});

export default model<User>("User", userSchema, "Users");
