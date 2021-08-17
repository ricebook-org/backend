import { getWrappedApp, Logger } from "hyougen";
import { NonBodiedContext } from "hyougen/lib/routers";
import koa from "koa";
import dotenv from "dotenv";

dotenv.config();

const app = getWrappedApp(new koa(), true);
const PORT = 7070 || process.env.PORT;

app.get("/", (ctx: NonBodiedContext) => {
	ctx.hyRes.genericSuccess();
});

app.Listen(PORT, () =>
	Logger.info(`Server started on PORT: ${PORT}`, "src/main.ts")
);
