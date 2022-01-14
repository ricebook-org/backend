import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import User from "../models/User";
import fs from "fs";
import paths from "../utils/paths";
import path from "path";
import { v4 as uuid } from "uuid";
import { Picture } from "../utils/helpers";
import { isFileImage } from "../utils/helpers";
import { verifyToken } from "../middlewares/verifyToken";

const TAG = "src/routers/profile.ts";

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root, verifyToken);

	router.post("/:id/profile/picture", {}, async (ctx) => {
		const existingUser = await User.findById(ctx.params.id);

		if (existingUser == undefined) {
			throw new HyError(ErrorKind.BAD_REQUEST, "User not found!", TAG);
		}

		if (existingUser.propicPath != "") {
			throw new HyError(
				ErrorKind.CONFLICT,
				"Profile picture already exists",
				TAG
			);
		}

		const proPic: Picture = JSON.parse(
			JSON.stringify(ctx.hyFiles.profile_picture)
		);

		if (
			proPic == undefined ||
			(proPic.type != "image/jpeg" && proPic.type != "image/png")
		) {
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"`profile_picture` with png/jpg file format required",
				TAG
			);
		}

		if (!isFileImage(proPic.path)) {
			throw new HyError(ErrorKind.BAD_REQUEST, "Invalid Image", TAG);
		}

		//! Must create `assets/profile_pictures` directory before proceeding
		const outPath = path.join(
			paths.root,
			"/assets/profile_pictures/" +
				uuid() +
				proPic.name.match(/\.[0-9a-z]{1,5}$/i)
		);

		fs.copyFile(proPic.path, outPath, (err) => {
			if (err != undefined) {
				throw new HyError(
					ErrorKind.INTERNAL_SERVER_ERROR,
					"Server could not process the image, try again later",
					TAG
				);
			}
		});

		existingUser.propicPath = outPath;
		await existingUser.save();

		return ctx.hyRes.genericSuccess();
	});

	router.get("/:id/profile/picture", async (ctx) => {
		const id = ctx.params.id;
		const user = await User.findById(id);

		if (user == undefined) {
			throw new HyError(ErrorKind.BAD_REQUEST, "User not found!", TAG);
		}

		if (user.propicPath == "") {
			// TODO: send placeholder image
			throw new HyError(ErrorKind.BAD_REQUEST, "Placeholder Image", TAG);
		}

		const fileType = user.propicPath.split(".").pop();
		if (fileType != "jpeg" && fileType != "jpg" && fileType != "png") {
			throw new HyError(
				ErrorKind.INTERNAL_SERVER_ERROR,
				"Server could not process the type of profile picture",
				TAG
			);
		}

		ctx.type =
			fileType == "jpeg" || fileType == "jpg"
				? "image/jpeg"
				: "image/png";
		ctx.body = fs.readFileSync(user.propicPath);
	});
};
