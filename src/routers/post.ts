import { NumberLesserThan, String } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import path from "path";
import { verifyToken } from "../middlewares/verifyToken";
import { v4 as uuid } from "uuid";
import { createArray, doesFileExist, imageFormatFrom } from "../utils/helpers";
import { Image } from "../drytypes/Image";
import StrNumber from "../drytypes/StrNumber";
import fsp from "fs/promises";
import Post from "../models/Post";
import { UserSchema } from "../../MonType";
import paths from "../utils/paths";
import Jimp from "jimp";
import { SupportedFormats } from "../drytypes/SupportedFormats";
import { ImageIndex } from "../drytypes/ImageIndex";

const TAG = "src/routers/post.ts";

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root, verifyToken);

	router.get("/my-posts", async (ctx) => {
		const posts = await Post.find({ userId: ctx.state.user.id }).lean();

		ctx.hyRes.success("Operation successful!", { posts });
	});

	router.get("/feed/:page", async (ctx) => {
		if (!StrNumber.guard(ctx.params.page))
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"Page must be a number!",
				TAG
			);

		const ITEMS_PER_PAGE = 10;
		const page = parseInt(ctx.params.page);

		const feed = await Post.find({})
			.sort({
				createdAt: "desc",
				grains: "desc",
			})
			.limit(ITEMS_PER_PAGE)
			.skip((page - 1) * ITEMS_PER_PAGE)
			.lean();

		ctx.hyRes.success("Successful!", {
			feed,
		});
	});

	router.post(
		"/post",
		{
			title: String,
			description: String,
			tags: String,
			imagesSent: NumberLesserThan(5),
		},
		async (ctx) => {
			const user: UserSchema = ctx.state.user;
			const { title, description, tags } = ctx.hyBody;
			const tagsArr = tags.split(",");

			const postErr = (msg: string, kind = ErrorKind.BAD_REQUEST) =>
				new HyError(kind, msg, TAG);

			// check if title exceeds 30 chars
			if (title.length > 30)
				throw postErr(
					`Title too long (${title.length})! A maximum of 30 characters is allowed.`
				);

			// check if description exceeds 150 chars
			if (description.length > 150)
				throw postErr(
					`Description too long (${description.length})! A maximum of 150 characters is allowed.`
				);

			// check if there are more than 10 tags
			if (tagsArr.length > 10)
				throw postErr(
					`Too many tags (${tagsArr.length})! A maximum of 10 tags is allowed.`
				);

			// an array to store the final image paths
			const imagePaths: string[] = [];

			// this function will be used when there's an error while
			// processing the images. In a scenario where there's multiple
			// images to be saved and, say, the last image fails, all the
			// initial images should now be deleted as well since they've
			// been rendered invalid along with the last image.
			const abort = async (msg: string, kind = ErrorKind.BAD_REQUEST) => {
				for (let path of imagePaths) {
					try {
						await fsp.unlink(path);
					} catch (e) {}
				}
				return postErr(msg, kind);
			};

			// loop over the sent images, perform checks, and save.
			// add the path to imagePaths when successful.
			for (let i of createArray(1, ctx.hyBody.imagesSent)) {
				const postPic = ctx.hyFiles[`image${i}`] as unknown;

				if (!Image.guard(postPic))
					throw abort("Couldn't receive the sent image(s)!");

				if (!postPic.type.startsWith("image"))
					throw abort("An image file format is required");

				const format = await imageFormatFrom(postPic.path);

				if (!SupportedFormats.guard(format))
					throw abort("Invalid image data!");

				// get a unique unused path
				const destPath = await (async () => {
					let name = uuid();
					const getPath = (name: string) =>
						path.join(paths.assets.postImages, `${name}.jpeg`);

					while (await doesFileExist(getPath(name))) name = uuid();

					return getPath(name);
				})();

				/*
				 * Images are to be stored on the server only as JPEG
				 * In case they're in PNG, we need to convert them
				 * However, an exception can be made in case of GIFS (TODO)
				 */
				try {
					const img = await Jimp.read(postPic.path);

					// jimp will auto convert to jpeg if it's png
					if (format === "jpeg" || format === "png")
						await img.quality(90).writeAsync(destPath);

					imagePaths.push(destPath);
				} catch (err) {
					throw abort(
						"Server could not process the image(s), please try again later",
						ErrorKind.INTERNAL_SERVER_ERROR
					);
				}
			}

			await Post.create({
				title,
				description,
				userId: user.id,
				tags: tagsArr,
				imagePaths,
			});

			ctx.hyRes.genericSuccess();
		}
	);

	router.get("/post/:id", async (ctx) => {
		const post = await Post.findById(ctx.params.id).lean();

		if (!post)
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"A post with the given ID does not exist!",
				TAG
			);

		ctx.hyRes.success("Operation successful!", {
			title: post.title,
			description: post.description,
			postedBy: post.userId,
			imageCount: post.imagePaths.length,
			grains: post.grains,
		});
	});

	// TODO multiple images
	router.get("/post/:id/image/:index", async (ctx) => {
		if (!ImageIndex.guard(ctx.params.index))
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"Index must be 1 to 4!",
				TAG
			);

		const index = parseInt(ctx.params.index) - 1;

		const post = await Post.findById(ctx.params.id).lean();
		if (!post)
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				"Post with specified id not found",
				TAG
			);

		if (index >= post.imagePaths.length)
			throw new HyError(
				ErrorKind.BAD_REQUEST,
				`This post contains only ${post.imagePaths.length} images!`,
				TAG
			);

		ctx.type = "image/jpeg";
		ctx.body = await fsp.readFile(post.imagePaths[index]);
	});
};
