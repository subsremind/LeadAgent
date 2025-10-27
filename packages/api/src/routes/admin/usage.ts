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
  date: string;
};

// 合并后的用户使用统计类型
type MergedUserUsage = {
  user: string;
  date: string;
  token_usage: number;
  post_count: number;
};

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

			// 使用单一SQL查询获取合并的用户使用统计数据
			const userUsageStats = await db.$queryRaw<MergedUserUsage[]>`
				WITH token_stats AS (
					SELECT 
						COALESCE(u.name, 'SYSTEM') as "user", 
						TO_CHAR(l."timestamp"::date, 'YYYY-MM-DD') as "date", 
						SUM("totalTokens") as token_usage
					FROM ai_request_log l 
					LEFT JOIN public.user u ON l."userId" = u.id 
					GROUP BY u.name, l."timestamp"::date
				),
				post_stats AS (
					SELECT 
						COALESCE(u.name, 'SYSTEM') as "user", 
						TO_CHAR(r.created_at::date, 'YYYY-MM-DD') as "date", 
						COUNT(r.id) as post_count
					FROM ai_analyze_record r 
					LEFT JOIN public.user u ON r."userId" = u.id 
					GROUP BY u.name, r.created_at::date
				),
				all_dates_users AS (
					SELECT "user", "date" FROM token_stats
					UNION
					SELECT "user", "date" FROM post_stats
				)
				SELECT 
					a."user" as "user",
					a."date" as "date",
					COALESCE(t.token_usage, 0) as token_usage,
					COALESCE(p.post_count, 0) as post_count
				FROM all_dates_users a
				LEFT JOIN token_stats t ON a."user" = t."user" AND a."date" = t."date"
				LEFT JOIN post_stats p ON a."user" = p."user" AND a."date" = p."date"
				ORDER BY a."date" ASC, a."user" ASC
			`;

			// 累加 token_usage 计算总token使用量
			const totalTokens = userUsageStats.reduce((acc, cur) => acc + Number(cur.token_usage || 0), 0);
			// 累加 post_count 计算总分析数量
			const totalAnalyzeCount = userUsageStats.reduce((acc, cur) => acc + Number(cur.post_count || 0), 0);

			// 将BigInt转换为Number类型，避免JSON序列化错误
			const serializedUserUsageStats = userUsageStats.map(stat => ({
				user: stat.user,
				date: stat.date,
				token_usage: Number(stat.token_usage),
				post_count: Number(stat.post_count)
			}));

			// 返回合并后的数据和原有统计信息
			return c.json({ 
				totalUsers: Number(totalUsers),
				totalCategorys: Number(totalCategorys),
				totalPosts: Number(totalPosts),
				totalTokens,
				totalAnalyzeCount,
				userUsageStats: serializedUserUsageStats
			});
		},
	);
