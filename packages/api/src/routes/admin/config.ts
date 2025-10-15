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
					
				if (!tokenData || !tokenData.accessToken || !tokenData.refreshToken) {
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
	)
	.delete(
		"/delete",
		describeRoute({
			summary: "Delete Reddit authorization",
			tags: ["Callback"],
		}),
		async (c) => {
			try {
				const user = c.get("user");
				const tokenData = await db.integrationAuth.deleteMany({
					where: {
							type: 'reddit'
					}
				});
					
				if (!tokenData) {
					return c.json({
						isDeleted: false,
						message: "Remove Reddit authorization failed"
					});
				}
				return c.json({
					isDeleted: true,
					message: "Reddit authorization deleted successfully"
				});


			} catch (error) {
				logger.error("Error deleting Reddit authorization:", error);
				return c.json(
					{
						error: "Failed to delete authorization",
						details: error instanceof Error ? error.message : "Unknown error"
					},
					500
				);
			}
		}
	)
	.post(
		"/authorize",
		describeRoute({
			summary: "Authorize Reddit",
			tags: ["Callback"],
		}),
		validator("json", z.object({
			accessToken: z.string(),
			refreshToken: z.string(),
			tokenType: z.string().optional().default("bearer"),
			expiresAt: z.string().optional(),
			scope: z.string().optional().default("read")
		})),
		async (c) => {
			try {
				const user = c.get("user");
				const { accessToken, refreshToken, tokenType, expiresAt, scope } = c.req.valid("json");

				// 删除现有的 Reddit 授权记录
				await db.integrationAuth.deleteMany({
					where: {
						type: 'reddit'
					}
				});

				// 创建新的授权记录
				const authRecord = await db.integrationAuth.create({
					data: {
						accessToken,
						refreshToken,
						tokenType,
						expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
						scope,
						type: 'reddit',
					}
				});

				logger.info("Reddit authorization saved successfully:", { id: authRecord.id });

				return c.json({
					success: true,
					message: "Reddit authorization saved successfully"
				});

			} catch (error) {
				logger.error("Error saving Reddit authorization:", error);
				return c.json(
					{
						error: "Failed to save authorization",
						details: error instanceof Error ? error.message : "Unknown error"
					},
					500
				);
			}
		}
	);
