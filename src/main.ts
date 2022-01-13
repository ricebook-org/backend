import { getWrappedApp, Logger } from "hyougen";
import { NonBodiedContext } from "hyougen/lib/routers";
import koa from "koa";
import dotenv from "dotenv";
import AuthRouter from "./routers/auth";
import mongoose from "mongoose";
import ProfileRouter from "./routers/profile";
import Showdown from "showdown";
import process from "process";
import PostRouter from "./routers/post";
import paths from "./utils/paths";
import fsp from "fs/promises";

const TAG = "src/main.ts";

async function main() {
	dotenv.config();

	const app = getWrappedApp(new koa(), true);

	try {
		// connect to the database
		await mongoose.connect(
			process.env.DB_URI || "mongodb://localhost/Ricebook"
		);

		Logger.success("Successfully connected to database!", TAG);
	} catch (err) {
		return Logger.error(`Error connecting to database:\n${err}`, TAG);
	}

	// root routes
	app.get("/", (ctx: NonBodiedContext) => {
		ctx.hyRes.genericSuccess();
	});

	const convertor = new Showdown.Converter();
	app.get("/docs", async (ctx) => {
		const fileContent = await fsp.readFile(paths.root + "/doc.md");
		const html = convertor.makeHtml(fileContent.toString());
		ctx.type = "html";
		ctx.body = html;
	});

	// routers
	AuthRouter(app, "/user");
	ProfileRouter(app, "/user");
	PostRouter(app, "/user");

	// directories
	for (const path of Object.values(paths.assets)) {
		try {
			await fsp.mkdir(path, { recursive: true });
			Logger.success(`Created asset directory: ${path}`, TAG);
		} catch (e) {
			Logger.error(
				`Failed to create asset directory: ${path} because: ${e}`,
				TAG
			);
		}
	}

	// listen
	const PORT = Number(process.env.PORT) || 8080;
	app.Listen(PORT, () => {
		app.saveApiDoc();
		Logger.success(`Server started on PORT: ${PORT}`, TAG);
	});
}

main();
