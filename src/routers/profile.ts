import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import User from "../models/User";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { Picture } from "../utils/helpers";
import { isFileImage } from "../utils/helpers";
import { verifyToken } from "../middlewares/token";

const TAG = "src/routers/profile.ts";
const project_root = path.join(__dirname + "/../..");

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

		const profile_picture: Picture = JSON.parse(
			JSON.stringify(ctx.hyFiles.profile_picture)
		);

		if (
			profile_picture == undefined ||
			(profile_picture.type != "image/jpeg" &&
				profile_picture.type != "image/png")
		) {
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"`profile_picture` with png/jpg file format required",
				TAG
			);
		}

		if (!isFileImage(profile_picture.path)) {
			throw new HyError(ErrorKind.BAD_REQUEST, "Invalid Image", TAG);
		}

		//! Must create `assets/profile_pictures` directory before proceeding
		const out_path = path.join(
			project_root,
			"/assets/profile_pictures/" +
				uuid() +
				profile_picture.name.match(/\.[0-9a-z]{1,5}$/i)
		);

		await fs.copyFile(profile_picture.path, out_path, (err) => {
			if (err != undefined) {
				throw new HyError(
					ErrorKind.INTERNAL_SERVER_ERROR,
					"Server could not process the image, try again later",
					TAG
				);
			}
		});

		existingUser.propicPath = out_path;
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
			//TODO:  Send placeholder image
			throw new HyError(ErrorKind.BAD_REQUEST, "Placeholder Image", TAG);
		}

		const file_type = user.propicPath.split(".").pop();
		if (file_type != "jpeg" && file_type != "jpg" && file_type != "png") {
			throw new HyError(
				ErrorKind.INTERNAL_SERVER_ERROR,
				"Server could not process the type of profile picture",
				TAG
			);
		}

		ctx.type =
			file_type == "jpeg" || file_type == "jpg"
				? "image/jpeg"
				: "image/png";
		ctx.body = fs.readFileSync(user.propicPath);
	});
};
