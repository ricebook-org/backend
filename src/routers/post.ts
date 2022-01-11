import { String } from "drytypes";
import { ErrorKind, getRoutedWrappedApp, HyError, WrappedApp } from "hyougen";
import path from "path";
import { verifyToken } from "../middlewares/token";
import { v4 as uuid } from "uuid";
import { isFileImage, Picture } from "../utils/helpers";
import { copyFile, readFileSync } from "fs";
import Post from "../models/Post";
import { UserSchema } from "../../MonType";

const TAG = "src/routers/post.ts";
const project_root = path.join(__dirname + "/../..");

export default (wapp: WrappedApp, root: string) => {
	const router = getRoutedWrappedApp(wapp, root, verifyToken);

	router.get("/posts", async (ctx) => {
		const posts = await Post.find({ userId: ctx.state.user.id });

		ctx.hyRes.success("Operation successful!", { posts });
	});

	router.post(
		"/posts",
		{
			title: String,
			description: String,
			tags: String,
		},
		async (ctx) => {
			const user: UserSchema = ctx.state.user;
			const { title, description, tags } = ctx.hyBody;
			const tags_arr = tags.split(",");

			if (
				title.length > 30 ||
				description.length > 60 ||
				tags_arr.length <= 0 ||
				tags_arr.length > 10
			) {
				throw new HyError(ErrorKind.BAD_REQUEST, "Invalid Body!", TAG);
			}

			const profile_picture: Picture = JSON.parse(
				JSON.stringify(ctx.hyFiles.image)
			);

			if (
				profile_picture == undefined ||
				(profile_picture.type != "image/jpeg" &&
					profile_picture.type != "image/png")
			) {
				throw new HyError(
					ErrorKind.BAD_REQUEST,
					"`image` with png/jpg file format required",
					TAG
				);
			}

			if (!isFileImage(profile_picture.path)) {
				throw new HyError(ErrorKind.BAD_REQUEST, "Invalid Image", TAG);
			}

			//! Must create `assets/rices` directory before proceeding
			const out_path = path.join(
				project_root,
				"/assets/rices/" +
					uuid() +
					profile_picture.name.match(/\.[0-9a-z]{1,5}$/i)
			);

			copyFile(profile_picture.path, out_path, async (err) => {
				if (err != undefined) {
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
					tags: tags_arr,
					imagePath: out_path,
				});

				ctx.hyRes.genericSuccess();
			});
		}
	);

	router.get("/post/:id", async (ctx) => {
		const id = ctx.params.id;

		const post = await Post.findById(id);
		ctx.hyRes.success("Operation successful!", { post });
	});

	//TODO: Multiple image thingy later
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

		const file_type = post.imagePath.split(".").pop();
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
		ctx.body = readFileSync(post.imagePath);
	});
};
