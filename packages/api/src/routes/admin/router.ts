import { Hono } from "hono";
import { organizationRouter } from "./organizations";
import { userRouter } from "./users";
import { usageRouter } from "./usage";
import { settingRouter } from "./setting";
import { integrationRouter } from "./integration";
import { userCreditSettingRouter } from "./user_credit_setting";



export const adminRouter = new Hono()
	.basePath("/admin")
	.route("/", organizationRouter)
	.route("/", userRouter)
	.route("/", usageRouter)
	.route("/", settingRouter)
	.route("/", integrationRouter)
	.route("/", userCreditSettingRouter);
