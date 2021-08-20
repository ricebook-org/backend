import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import User from "../models/User";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const TAG = "src/routers/profile.ts";
const project_root = path.join(__dirname + "/../..");

interface ProfilePicture {
	path: string;
	size: number;
	type: string;
	name: string;
}

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root);

	router.post("/:id/profile/picture", {}, async (ctx) => {
		const id = ctx.params.id;
		const existingUser = await User.findById(id);

		if (existingUser == undefined) {
			throw new HyError(ErrorKind.BAD_REQUEST, "User not found!", TAG);
		}

		const profile_picture: ProfilePicture = JSON.parse(
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

		existingUser.profile_picture_path = out_path;
		await existingUser.save();

		return ctx.hyRes.genericSuccess();
	});
};
