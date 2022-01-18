import { model, Schema } from "mongoose";
import { PostSchema } from "../../MonType";

// TODO: Comment, isReported, add multiple image array later
const PostSchema = new Schema<PostSchema>(
	{
		title: { type: String, required: true },
		userId: { type: String, required: true },
		description: { type: String, required: true },
		imagePaths: { type: [String], required: false },
		grainedBy: { type: [Schema.Types.ObjectId], default: [] },
		tags: { type: [String], required: true },
	},
	{
		timestamps: true,
		_id: true,
		id: true,
	}
);

export default model<PostSchema>("Post", PostSchema, "post");
