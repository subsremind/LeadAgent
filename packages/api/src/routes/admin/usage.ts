import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { logger } from "@repo/logs";
// import { useNow } from "use-intl";

type UserCount = {
  user: string;
  count: number;
}

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

			const totalUsers = await db.user.count();
			const totalCategorys = await db.category.count();
			const totalPosts = await db.redditPost.count();

			// 统计最近7天的reddit分析记录， 并按userId分组， 关联用户，查询用户名和数量2个字段
			const usersWithAnalyzeCount = await db.$queryRaw<UserCount[]>`select u.name, TO_CHAR(r.created_at::date, 'YYYY-MM-DD') as "date", count(r.id) as "count" from ai_analyze_record r left join public.user u on "userId"  = u.id group by u.name, r.created_at::date`

			const userTokenUsageRecords = await db.$queryRaw<UserCount[]>`SELECT case when u.name is null then 'SYSTEM' else u.name end as user, TO_CHAR(l."timestamp"::date, 'YYYY-MM-DD') as date, SUM("totalTokens") as "count" FROM ai_request_log l left join public.user u on l."userId"  = u.id GROUP BY "name", l."timestamp"::date`;
			// 累加 count
			const totalTokens = userTokenUsageRecords.reduce((acc, cur) => acc + Number(cur.count || 0), 0);
			// 累加 usersWithAnalyzeCount
			const totalAnalyzeCount = usersWithAnalyzeCount.reduce((acc, cur) => acc + Number(cur.count || 0), 0);

			
			logger.info({  userTokenUsageRecords, usersWithAnalyzeCount });

			return c.json({ totalUsers,  totalCategorys, totalPosts, totalTokens, totalAnalyzeCount, userTokenUsageRecords, usersWithAnalyzeCount });
		},
	);
