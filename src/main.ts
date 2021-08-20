import { getWrappedApp, Logger } from "hyougen";
import { NonBodiedContext } from "hyougen/lib/routers";
import koa from "koa";
import dotenv from "dotenv";
import AuthRouter from "./routers/auth";
import mongoose from "mongoose";
import ProfileRouter from "./routers/profile";

dotenv.config();

const TAG = "src/main.ts";
const app = getWrappedApp(new koa(), true);
const PORT = Number(process.env.PORT) || 8080;

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

AuthRouter(app, "/user");
ProfileRouter(app, "/user");

app.Listen(PORT, () => {
	app.saveApiDoc();
	Logger.success(`Server started on PORT: ${PORT}`, "src/main.ts");
});
