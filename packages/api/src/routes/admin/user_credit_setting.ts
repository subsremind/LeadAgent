import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { logger } from "@repo/logs";


export const userCreditSettingRouter = new Hono()
	.basePath("/user_credit_setting")
	.use(adminMiddleware) 
	.get(
		"/",
		describeRoute({
			summary: "Get admin setting",
			tags: ["Setting"],
		}),
		async (c) => {
			const userCreditSettings = await db.userCreditSetting.findMany();
			// 从 key, value 的结构整理成 { key: value } 的对象
			const settings = userCreditSettings.reduce((acc, cur) => {
				// 确保userId不为null再用作对象索引
				if (cur.userId !== null) {
					acc[cur.userId] = cur.credit;
				}
				return acc;
			}, {} as Record<string, number>);
			return c.json(settings);
		}
	)
	.post(
		"/save",
		describeRoute({
			summary: "Save user credit setting",
			tags: ["Setting"],
		}),
		validator("json", z.object({
			credit: z.number().int().min(0),
			userId: z.string(),
		})),
		async (c) => {
			try {
				const { credit, userId } = c.req.valid("json");
				
				// 验证用户是否存在
				const targetUser = await db.user.findUnique({
					where: { id: userId }
				});
				
				if (!targetUser) {
					return c.json(
						{ error: "User not found" },
						404
					);
				}
				
				const dbRecord = await db.userCreditSetting.findFirst({
					where: {
						userId: userId
					}
				});

				if (!dbRecord) {
					await db.userCreditSetting.create({
						data: {
							userId: userId,
							credit,
							date: new Date(),
						}
					});
				} else {
					await db.userCreditSetting.update({
						where: {
							userId: userId
						},
						data: {
							credit,
							date: new Date(),
						}
					});
				}

				return c.json({
					message: "User credit setting saved successfully"
				});


			} catch (error) {
				logger.error("Error saving user credit setting:", error);
				return c.json(
					{
						error: "Failed to save user credit setting",	
						details: error instanceof Error ? error.message : "Unknown error"
					},
					500
				);
			}
		}
	)
	;
