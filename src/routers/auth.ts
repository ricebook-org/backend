import { Undefined } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import { doesUserExist, doesUserExistOneOf } from "../utils/user";
import User from "../models/User";
import { sendMail, emailData } from "../utils/mail";
import { getOtp as generateOtp } from "../utils/helpers";
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

			if (await doesUserExist(username, email)) {
				throw new HyError(
					ErrorKind.CONFLICT,
					"User with email/username already exists",
					TAG
				);
			}

			const otp = generateOtp();

			const data: emailData = {
				to: email,
				subject: "Verify your Ricebook sign-up",
				text: `Hey there!\n\nYour Ricebook OTP is: ${otp}\n\nThanks for joining us!`,
			};

			try {
				await sendMail(data);
			} catch (e) {
				console.log(`so, ${e} happened...`)
				throw new HyError(ErrorKind.INTERNAL_SERVER_ERROR, "Couldn't send validation mail", TAG);
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

			if (!bcrypt.compareSync(password, existingUser.password)) {
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
		{ username: Username, email: Email, otp: Otp },
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

			if (existingUser.otp == otp) {
				existingUser.isVerified = true;
				await existingUser.save();
				return ctx.hyRes.success("User was verified successfully");
			}

			throw new HyError(ErrorKind.BAD_REQUEST, "Invalid OTP", TAG);
		}
	);
};
