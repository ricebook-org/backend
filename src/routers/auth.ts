import { String } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import { existingUser } from "../utils/user";
import User from "../models/User";
import { sendMail, emailData } from "../utils/mail";
import { getOtp } from "../utils/helpers";

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

			const otp = getOtp();

			await User.create({
				email,
				password,
				username,
				otp,
			});

			const data: emailData = {
				to_user: email,
				subject: "Verify email for ricebook signup",
				text: `Hello, \n\nOTP: ${otp}`,
			};
			await sendMail(data);

			ctx.hyRes.genericSuccess();
		}
	);

	router.post(
		"/verify",
		{ username: String, email: String, otp: String },
		async (ctx) => {
			const { username, email, otp } = ctx.hyBody;

			const existingUser = await User.findOne({ username, email });
			if (existingUser == undefined) {
				throw new HyError(
					ErrorKind.BAD_REQUEST,
					"User with specified email/username not found",
					TAG
				);
			}

			if (existingUser.isVerified) {
				throw new HyError(
					ErrorKind.CONFLICT,
					"User is already verified",
					TAG
				);
			}

			if (existingUser.otp == otp) {
				existingUser.isVerified = true;
				await existingUser.save();
				return ctx.hyRes.success("User was verified successfully");
			}
			throw new HyError(ErrorKind.BAD_REQUEST, "Invalid OTP", TAG);
		}
	);
};
