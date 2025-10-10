import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";

export const usageRouter = new Hono()
	.basePath("/usage")
	.use(adminMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().optional(),
				limit: z.string().optional().default("10").transform(Number),
				offset: z.string().optional().default("0").transform(Number),
			}),
		),
		describeRoute({
			summary: "Get all usage",
			tags: ["Administration"],
		}),
		async (c) => {
			const { query, limit, offset } = c.req.valid("query");

			const totalUser = await db.user.count();


			// const usage = await db.aIRequestLog.findMany({
			// 	where: {
			// 		query: { contains: query, mode: "insensitive" },
			// 	},
			// 	take: limit,
			// 	skip: offset,
			// });

			// const total = await db.aIRequestLog.count();

			return c.json({ totalUser });
		},
	);
