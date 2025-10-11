import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { logger } from "@repo/logs";


export const settingsRouter = new Hono()
	.basePath("/settings")
	.use(adminMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get all settings",	
			tags: ["Administration"],
		}),
		async (c) => {
			const { query} = c.req.valid("query");


			return c.json({});
		},
	);
