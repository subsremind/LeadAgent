import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { logger } from "@repo/logs";


export const configRouter = new Hono()
	.basePath("/config")
	.use(adminMiddleware)
	.get(
		"/status",
		describeRoute({
			summary: "Check Reddit authorization status",
			tags: ["Callback"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				try {
					const tokenData = await db.integrationAuth.findFirst({
						where: {
							type: 'reddit'
						},
						orderBy: {
							createdAt: 'desc'
						}
					});
					
				if (!tokenData && !tokenData?.accessToken) {
					return c.json({
						isAuthorized: false,
						message: "No Reddit authorization found"
					});
				}

				// 检查 token 是否过期
				if (tokenData.expiresAt) {
					const expiresAt = new Date(tokenData.expiresAt).getTime();
					const now = Date.now();
					
					if (now >= expiresAt) {
						return c.json({
							isAuthorized: false,
							message: "Reddit authorization expired"
						});
					}
				}

				return c.json({
					isAuthorized: true,
					message: "Reddit authorization is active"
				});
				} catch (error) {
					logger.error("======= Error fetching Reddit token:", error);
					return c.json(
						{
							error: "Failed to fetch Reddit token",
							details: error instanceof Error ? error.message : "Unknown error"
						},
						500
					);
				}

			} catch (error) {
				logger.error("Error checking Reddit authorization status:", error);
				return c.json(
					{
						error: "Failed to check authorization status",
						details: error instanceof Error ? error.message : "Unknown error"
					},
					500
				);
			}
		}
	);
