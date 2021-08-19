import { String, Undefined } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import { existingUser } from "../utils/user";
import User from "../models/User";
import { sendMail, emailData } from "../utils/mail";
import { getOtp } from "../utils/helpers";
import { Email } from "../drytypes/Email";
import { Username } from "../drytypes/Username";
import { Password } from "../drytypes/Password";
import { Otp } from "../drytypes/Otp";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const TAG = "src/routers/auth.ts";

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root);

	router.post(
		"/register",
		{ username: Username, email: Email, password: Password },
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

			ctx.hyRes.success(
				"User was registered and email was sent successfully"
			);
		}
	);

	router.post(
		"/login",
		{
			username: Username.union(Undefined),
			email: Email.union(Undefined),
			password: Password,
		},
		async (ctx) => {
			let { username, email, password } = ctx.hyBody;
			if (username == undefined && email == undefined) {
				throw new HyError(
					ErrorKind.BAD_REQUEST,
					"Email or username is required",
					TAG
				);
			}

			const existingUser = await User.findOne({
				...(username == undefined ? { email } : { username }),
			});

			if (existingUser == undefined) {
				throw new HyError(
					ErrorKind.NOT_FOUND,
					"User with specified emai/username not found",
					TAG
				);
			}

			if (!existingUser.isVerified) {
				throw new HyError(
					ErrorKind.UNAUTHORIZED,
					"User must verify before login",
					TAG
				);
			}

			if (!bcrypt.compareSync(password!!, existingUser.password)) {
				throw new HyError(
					ErrorKind.UNAUTHORIZED,
					"Invalid username/email or password",
					TAG
				);
			}

			const token = uuidv4();
			existingUser.token = token;
			await existingUser.save();

			return ctx.hyRes.success("User was logged in successfully!", {
				token,
				user_id: existingUser.id,
			});
		}
	);

	router.post(
		"/verify",
		{ username: Username, email: Email, otp: Otp },
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
