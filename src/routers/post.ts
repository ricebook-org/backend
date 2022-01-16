import { String } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import path from "path";
import { verifyToken } from "../middlewares/verifyToken";
import { v4 as uuid } from "uuid";
import { doesFileExist, isFileImage, Picture } from "../utils/helpers";
import { Image } from "../drytypes/Image";
import fsp from "fs/promises";
import Post from "../models/Post";
import { UserSchema } from "../../MonType";
import paths from "../utils/paths";
import Jimp from "jimp";
import { SupportedFormats } from "../drytypes/SupportedFormats";

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

			const postErr = (msg: string) =>
				new HyError(ErrorKind.BAD_REQUEST, msg, TAG);

			if (title.length > 30)
				throw postErr(
					`Title too long (${title.length})! A maximum of 30 characters is allowed.`
				);

			if (description.length > 150)
				throw postErr(
					`Description too long (${description.length})! A maximum of 150 characters is allowed.`
				);

			if (tagsArr.length > 10)
				throw postErr(
					`Too many tags (${tagsArr.length})! A maximum of 10 tags is allowed.`
				);

			const postPic = ctx.hyFiles.image as unknown;

			if (!Image.guard(postPic))
				throw postErr("Couldn't receive the sent image!");

			if (!postPic.type.startsWith("image"))
				throw postErr("An image file format is required");

			const format = await isFileImage(postPic.path);

			if (!SupportedFormats.guard(format))
				throw postErr("Invalid image data!");

			const destPath = await (async () => {
				let name = uuid();
				const getPath = (name: string) =>
					path.join(paths.assets.postImages, `${name}.jpeg`);

				while (await doesFileExist(getPath(name))) name = uuid();

				return getPath(name);
			})();

			/**
			 * Images are to be stored on the server only as JPEG
			 * In case they're in PNG, we need to convert them
			 * However, an exception can be made in case of GIFS (TODO)
			 */
			try {
				const img = (await Jimp.read(postPic.path)).quality(80);

				// jimp will auto convert to jpeg if it's png
				if (format === "jpeg" || format === "png")
					await img.quality(90).writeAsync(destPath);
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
				imagePath: destPath,
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
