import { db } from "@repo/database";
import { user } from "@repo/database/drizzle/schema";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";

export const userRouter = new Hono()
	.basePath("/users")
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
			summary: "Get all users",
			tags: ["Administration"],
		}),
		async (c) => {
			const { query, limit, offset } = c.req.valid("query");

			const users = await db.query.user.findMany({
				where: (u, { ilike }) =>
					query && query.trim() ? ilike(u.name, `%${query}%`) : undefined,
				limit,
				offset,
			});

			const total = await db.$count(user);

			return c.json({ users, total });
		},
	);
