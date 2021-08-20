import { ErrorKind, HyError } from "hyougen";
import { hyBodiedRouterMiddleware } from "hyougen/lib/routers";
import User from "../models/User";

const TAG = "src/middlewares/token.ts";
export const verifyToken: hyBodiedRouterMiddleware<any> = async (ctx, next) => {
	const token = ctx.request.get("Authorization");
	if (token == undefined) {
		throw new HyError(ErrorKind.BAD_REQUEST, "Token not provided", TAG);
	}

	const existingUser = await User.findOne({ token }).lean();
	if (existingUser == undefined) {
		throw new HyError(ErrorKind.UNAUTHORIZED, "Invalid Token!", TAG);
	}

	await next();
};
