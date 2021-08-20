import { hyBodiedRouterMiddleware } from "hyougen/lib/routers";

export const verifyToken: hyBodiedRouterMiddleware<any> = (ctx) => {
	console.log(ctx.request.get("token"));
};
