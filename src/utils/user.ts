import { ErrorKind, HyError } from "hyougen";
import User from "../models/User";

export const doesUserExist = async (username: string, email: string) => {
	const existingUser = await User.findOne({
		username,
		email,
	}).lean();

	return !existingUser;
};

/**
 *
 * @param username a username or undefined
 * @param email an email or undefined
 * @param TAG TAG for the file in case an error occurs
 * @returns a User object if a user with the provided username/email exists.
 */
export const doesUserExistOneOf = async (
	username: string | undefined,
	email: string | undefined,
	TAG: string
) => {
	if (username == undefined && email == undefined) {
		throw new HyError(
			ErrorKind.BAD_REQUEST,
			"Either an email or a username is required",
			TAG
		);
	}

	const existingUser = await User.findOne({
		...(username == undefined ? { email } : { username }),
	});

	if (existingUser == undefined) {
		throw new HyError(
			ErrorKind.NOT_FOUND,
			"A user with this username/email does not exist",
			TAG
		);
	}

	return existingUser;
};
