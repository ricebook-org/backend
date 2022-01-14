import { Number, Record, String } from "drytypes";

export const Image = Record({
	path: String,
	size: Number,
	type: String,
	name: String,
});
