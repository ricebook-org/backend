import { String } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import path from "path";
import { verifyToken } from "../middlewares/verifyToken";
import { v4 as uuid } from "uuid";
import { isFileImage, Picture } from "../utils/helpers";
import { Image } from "../drytypes/Image";
import fsp from "fs/promises";
import Post from "../models/Post";
import { UserSchema } from "../../MonType";
import paths from "../utils/paths";
import fs from "fs";

const TAG = "src/routers/post.ts";

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root, verifyToken);

	router.get("/my-posts", async (ctx) => {
		const posts = await Post.find({ userId: ctx.state.user.id });

		ctx.hyRes.success("Operation successful!", { posts });
	});

	router.post(
		"/post",
		{
			title: String,
			description: String,
			tags: String,
		},
		async (ctx) => {
			const user: UserSchema = ctx.state.user;
			const { title, description, tags } = ctx.hyBody;
			const tagsArr = tags.split(",");

			if (
				title.length > 30 ||
				description.length > 60 ||
				tagsArr.length <= 0 ||
				tagsArr.length > 10
			) {
				throw new HyError(
					ErrorKind.BAD_REQUEST,
					"Post doesn't match requirements",
					TAG
				);
			}

			const proPic = ctx.hyFiles.image as Picture;

			if (!Image.guard(proPic))
				throw new HyError(
					ErrorKind.BAD_REQUEST,
					"Couldn't receive the sent image!",
					TAG
				);

			if (!proPic.type.startsWith("image")) {
				throw new HyError(
					ErrorKind.BAD_REQUEST,
					"An image file format is required",
					TAG
				);
			}

			if (!isFileImage(proPic.path))
				throw new HyError(ErrorKind.BAD_REQUEST, "Invalid image!", TAG);

			const postPath = ((): string => {
				let name = uuid();
				const getPath = (name: string) =>
					path.join(paths.assets.postImages, name);

				while (fs.existsSync(getPath(name))) name = uuid();

				return getPath(name);
			})();

			try {
				await fsp.copyFile(proPic.path, postPath);
			} catch (err) {
				throw new HyError(
					ErrorKind.INTERNAL_SERVER_ERROR,
					"Server could not process the image, try again later",
					TAG
				);
			}

			await Post.create({
				title,
				description,
				userId: user.id,
				tags: tagsArr,
				imagePath: postPath,
			});

			ctx.hyRes.genericSuccess();
		}
	);

	router.get("/post/:id", async (ctx) => {
		const id = ctx.params.id;

		const post = await Post.findById(id);
		ctx.hyRes.success("Operation successful!", { post });
	});

	// TODO multiple images
	router.get("/post/:id/image", async (ctx) => {
		const id = ctx.params.id;
		const post = await Post.findById(id);

		if (post == undefined) {
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"Post with specified id not found",
				TAG
			);
		}

		const fileType = post.imagePath.split(".").pop();
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
		ctx.body = await fsp.readFile(post.imagePath);
	});
};
