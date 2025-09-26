import { db } from "@repo/database";
import { organization } from "@repo/database/drizzle/schema";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";

export const organizationRouter = new Hono()
	.basePath("/organizations")
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
			summary: "Get all organizations",
			tags: ["Administration"],
		}),
		async (c) => {
			const { query, limit, offset } = c.req.valid("query");

			// Drizzle 查询 + 关联 members，用于统计数量
			const orgs = await db.query.organization.findMany({
				where: query
					? (org, { ilike }) => ilike(org.name, `%${query}%`)
					: undefined,
				with: {
					members: true,
				},
				limit,
				offset,
			});

			// 映射为前端期望的结构：_count.members
			const organizations = orgs.map((o) => ({
				...o,
				_count: { members: o.members.length },
				// 不返回 members 明细，保持响应精简（Prisma include._count 等价）
				members: undefined as unknown as never,
			}));

			// 总数（保持原逻辑：不随 query 过滤变化）
			const total = await db.$count(organization);

			return c.json({ organizations, total });
		},
	)
	.get("/:id", async (c) => {
		const id = c.req.param("id");

		const org = await db.query.organization.findFirst({
			where: (org, { eq }) => eq(org.id, id),
			with: {
				members: true,
				invitations: true,
			},
		});

		return c.json(org);
	});
