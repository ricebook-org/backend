import User from "../models/User";

export const existingUser = async (username: string, email: string) => {
	const existingUser = await User.findOne({
		username,
		email,
	}).lean();
	return existingUser != undefined;
};
