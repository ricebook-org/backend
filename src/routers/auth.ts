import { String } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import { existingUser } from "../utils/user";
import User from "../models/User";

const TAG = "src/routers/auth.ts";

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root);

	router.post(
		"/register",
		{ username: String, email: String, password: String },
		async (ctx) => {
			const { email, password, username } = ctx.hyBody;

			if (await existingUser(username, email)) {
				throw new HyError(
					ErrorKind.CONFLICT,
					"User with email/username already exists",
					TAG
				);
			}

			// TODO: Send email, hash password
			await User.create({
				email,
				password,
				username,
			});

			ctx.hyRes.genericSuccess();
		}
	);
};
