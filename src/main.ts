import { getWrappedApp, Logger } from "hyougen";
import { NonBodiedContext } from "hyougen/lib/routers";
import koa from "koa";
import dotenv from "dotenv";
import AuthRouter from "./routers/auth";
import mongoose from "mongoose";
import ProfileRouter from "./routers/profile";
import { access, mkdir, readFileSync } from "fs";
import Showdown from "showdown";
import path from "path";
import PostRouter from "./routers/post";

dotenv.config();

access(__dirname + "/../assets", (error) => {
	if (error) {
		mkdir(
			__dirname + "/../assets/profile_pictures",
			{ recursive: true },
			(err) => {
				if (err) {
					Logger.error(`Error creating directory ${err}`, TAG);
				}
			}
		);
	}
});

const TAG = "src/main.ts";
const app = getWrappedApp(new koa(), true);
const PORT = Number(process.env.PORT) || 8080;
const project_root = path.join(__dirname + "/..");

mongoose.connect(process.env.DB_URI || "mongodb://localhost/Ricebook", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (err) => Logger.error(`Error connecting database\n${err}`, TAG));
db.once("open", () =>
	Logger.success("Successfully connected to database!", TAG)
);

app.get("/", (ctx: NonBodiedContext) => {
	ctx.hyRes.genericSuccess();
});

app.get("/docs", (ctx) => {
	const file_content = readFileSync(project_root + "/doc.md");
	const html = new Showdown.Converter().makeHtml(file_content.toString());
	ctx.type = "html";
	ctx.body = html;
});

AuthRouter(app, "/user");
ProfileRouter(app, "/user");
PostRouter(app, "/user");

app.Listen(PORT, () => {
	app.saveApiDoc();
	Logger.success(`Server started on PORT: ${PORT}`, "src/main.ts");
});
