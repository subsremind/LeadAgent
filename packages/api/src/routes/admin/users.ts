import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { getNoAnalyzePost } from "../../lib/ai-analyzepost";
import { syncRedditPost } from "../../lib/sync-reddit-post";

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

			// 获取default_credit设置值
			const defaultCreditSetting = await db.adminSetting.findUnique({
				where: { key: "default_credit" },
			});
			const defaultCredit = defaultCreditSetting ? parseInt(defaultCreditSetting.value || "0", 10) : 0;

			const users = await db.user.findMany({
				where: {
					name: { contains: query, mode: "insensitive" },
				},
				take: limit,
				skip: offset,
				include: {
					userCreditUsage: {
						select: {
							credit: true,
						},
					},
					userCreditSetting: {
						select: {
							credit: true,
						},
					},
				},
			});

			// 处理用户数据，当userCreditSetting为空时使用default_credit值
			const processedUsers = users.map((user) => ({
				...user,
				userCreditSetting: user.userCreditSetting || { credit: defaultCredit },
			}));

			const total = await db.user.count();

			return c.json({ users: processedUsers, total });
		},
	)
	.get('/start-analysis', async (c) => {
		await getNoAnalyzePost();
		return c.json({ success: true });
	})
	.get('/sync-reddit-posts', async (c) => {
		await syncRedditPost();
		return c.json({ success: true });
	});
