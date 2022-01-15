import { Undefined } from "drytypes";
import {
	ErrorKind,
	getRoutedWrappedApp,
	HyError,
	Logger,
	WrappedApp,
} from "hyougen";
import { doesUserExist, doesUserExistOneOf } from "../utils/user";
import User from "../models/User";
import { sendMail } from "../utils/mail";
import { generateOtp } from "../utils/helpers";
import { Email } from "../drytypes/Email";
import { Username } from "../drytypes/Username";
import { Password } from "../drytypes/Password";
import { Otp } from "../drytypes/Otp";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { RateLimiter } from "../utils/rate-limiter";

const TAG = "src/routers/auth.ts";

const canSendMail = (mail: string) =>
	RateLimiter.canPerformAction(`SEND_CODE ${mail}`, 3, 3600);

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root);

	router.post(
		"/register",
		{ username: Username, email: Email, password: Password },
		async (ctx) => {
			const { email, password, username } = ctx.hyBody;

			if (await doesUserExist(username, email)) {
				throw new HyError(
					ErrorKind.CONFLICT,
					"User with email/username already exists",
					TAG
				);
			}

			const otp = generateOtp();
			const rl = await canSendMail(email);

			if (rl === true) {
				try {
					await sendMail({
						to: email,
						subject: "Verify Your Ricebook Registration",
						text: `Hey there!\n\nYour Ricebook verification code is: ${otp}\n\nThanks for joining us!`,
					});
				} catch (e) {
					Logger.error(`Couldn't send verification mail: ${e}`, TAG);
					throw new HyError(
						ErrorKind.INTERNAL_SERVER_ERROR,
						"Couldn't send verification mail",
						TAG
					);
				}
			} else {
				throw new HyError(
					ErrorKind.TOO_MANY_REQUESTS,
					`Too many attempts to send verification email!` +
						`You can request for a verification code after ${rl} seconds.`,
					TAG
				);
			}

			await User.create({
				email,
				password,
				username,
				otp,
			});

			ctx.hyRes.success(
				"User registered! Please check your mail to verify your account."
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

			const existingUser = await doesUserExistOneOf(username, email, TAG);

			if (!existingUser.isVerified) {
				throw new HyError(
					ErrorKind.UNAUTHORIZED,
					"Please verify your account to proceed!",
					TAG
				);
			}

			if (!(await bcrypt.compare(password, existingUser.password))) {
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
				userId: existingUser.id,
			});
		}
	);

	router.post(
		"/verify",
		{
			username: Username.union(Undefined),
			email: Email.union(Undefined),
			otp: Otp,
		},
		async (ctx) => {
			const { username, email, otp } = ctx.hyBody;

			const existingUser = await doesUserExistOneOf(username, email, TAG);

			if (existingUser.isVerified) {
				throw new HyError(
					ErrorKind.CONFLICT,
					"User has already been verified",
					TAG
				);
			}

			if (existingUser.otp === otp) {
				existingUser.isVerified = true;
				await existingUser.save();
				return ctx.hyRes.success("User was verified successfully");
			}

			throw new HyError(ErrorKind.BAD_REQUEST, "Invalid OTP", TAG);
		}
	);
};
