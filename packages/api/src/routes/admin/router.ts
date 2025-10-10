import { Hono } from "hono";
import { organizationRouter } from "./organizations";
import { userRouter } from "./users";
import { usageRouter } from "./usage";

export const adminRouter = new Hono()
	.basePath("/admin")
	.route("/", organizationRouter)
	.route("/", userRouter)
	.route("/", usageRouter);
