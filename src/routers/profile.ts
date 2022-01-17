import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import User from "../models/User";
import fs from "fs";
import paths from "../utils/paths";
import path from "path";
import { doesFileExist, imageFormatFrom } from "../utils/helpers";
import { verifyToken } from "../middlewares/verifyToken";
import { Image } from "../drytypes/Image";
import { SupportedFormats } from "../drytypes/SupportedFormats";
import Jimp from "jimp";
import fsp from "fs/promises";

const TAG = "src/routers/profile.ts";

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root, verifyToken);
	const makeError = (msg: string, kind = ErrorKind.BAD_REQUEST) =>
		new HyError(kind, msg, TAG);

	router.post("/:id/profile/picture", {}, async (ctx) => {
		const existingUser = await User.findById(ctx.params.id).lean();

		if (!existingUser)
			throw new HyError(ErrorKind.BAD_REQUEST, "User not found!", TAG);

		const proPic = ctx.hyFiles.profilePicture;
		if (!Image.guard(proPic))
			throw makeError("Couldn't receive the image!");

		if (!proPic.type.startsWith("image"))
			throw makeError("An image file format is required");

		const format = await imageFormatFrom(proPic.path);

		if (!SupportedFormats.guard(format))
			throw makeError("Invalid image data!");

		const destPath = path.join(
			paths.assets.profilePictures,
			`${existingUser.username}.jpeg`
		);

		if (await doesFileExist(destPath)) await fsp.unlink(destPath);

		/*
		 * Images are to be stored on the server only as JPEG.
		 * In case they're in PNG, we need to convert them.
		 */
		try {
			const img = await Jimp.read(proPic.path);

			// jimp will auto convert to jpeg if it's png
			if (format === "jpeg" || format === "png")
				await img.quality(90).writeAsync(destPath);
		} catch (err) {
			throw makeError(
				"Server could not process the image(s), please try again later",
				ErrorKind.INTERNAL_SERVER_ERROR
			);
		}

		return ctx.hyRes.genericSuccess();
	});

	router.get("/:id/profile/picture", async (ctx) => {
		const id = ctx.params.id;
		const user = await User.findById(id).lean();

		if (!user) throw makeError("A user with the given ID does not exist!");

		const userImage = path.join(
			paths.assets.profilePictures,
			`${user.username}.jpeg`
		);

		// see if a custom image for this user exists
		if (await doesFileExist(userImage))
			ctx.body = await fsp.readFile(userImage);
		else {
			// since no custom image exists, send back
			// the default profile picture image
			const defaultImage = path.join(
				paths.assets.root,
				"default-profile-picture.jpg"
			);

			if (!(await doesFileExist(defaultImage)))
				throw makeError(
					"Couldn't fetch the default profile picture!",
					ErrorKind.INTERNAL_SERVER_ERROR
				);

			ctx.type = "image/jpeg";
			ctx.body = await fsp.readFile(defaultImage);
		}

		ctx.type = "image/jpeg";
	});
};
