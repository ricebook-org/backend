import { model, Schema } from "mongoose";
import { PostSchema } from "../../MonType";

const PostSchema = new Schema<PostSchema>(
	{
		title: { type: String, required: true },
		user_id: { type: String, required: true },
		description: { type: String, required: true },
		image_path: { type: String, required: true }, // TODO: Add multiple image array later
		grains: { type: Number, default: 0 },
		// TODO: Comment, isReported,
		tags: { type: [String], required: true },
	},
	{	
		timestamps: true,
		_id: true,
		id: true,
	}
);

export default model<PostSchema>("Post", PostSchema, "post");
