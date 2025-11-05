import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

import { authMiddleware } from "../../middleware/auth";
import { logger } from "@repo/logs";
import { AgentSettingQueryType } from "./types";

export const suggestionRouterRouter = new Hono()
	.basePath("/suggestion")
	.use(authMiddleware)
	.post(
		"/search",
		validator(
			"json",
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(10),
				subreddit: z.string().optional(),
				embeddingRate: z.number().default(0.7),
			}),
		),
		describeRoute({
			summary: "Search leadagent using vector search",
			tags: ["LeadAgent"],
		}),
		async (c) => {
			const { embeddingRate, page, pageSize, subreddit } = c.req.valid("json");
			const user = c.get("user");
			const agentSetting: AgentSettingQueryType = {
				subreddit: subreddit || "",
				embedding: "",
			};
			
			const subredditArr = agentSetting?.subreddit?.split(',') || [];
			const subredditFilter = subredditArr.map((item: String) => item.trim());
			const categoryIds = await db.category.findMany({
				select: {
				  id: true  // 只选择id字段
				},
				where: {
				  path: {
					in: subredditFilter
				  }
				}
			  })
			  
			if (!categoryIds.length) {
				return c.json({ error: "Subreddit not found" }, 404);
			}

			const categoryArray = categoryIds.map((item) => item.id);

			const offset = (page - 1) * pageSize;	

			// 查询当前页数据

			

			const records = await db.redditPost.findMany({
				include: {
					aiAnalyzeRecords: {
						select: {
							confidence: true,
							result: true,
						},
						where: {
							userId: user.id,
						}
					}
				},
				skip: offset,
				take: pageSize,
				where: {
					categoryId: {
						in: categoryArray
					},
					aiAnalyzeRecords: {
						some: {
							userId: user.id,
							confidence: {
								gte: embeddingRate
							}
						}
					}
				},
				orderBy: {
					createdUtc: 'desc'
				}
			});

			// 查询用户对每个记录的反馈, 转换查询结果为 { resourceId: { thumbsUp: true | false, ThumbsDown: true | false } } 格式
			const userFeedbacks = await db.resourceFeedback.findMany({
				select: {
					id: true,
					resourceId: true,
					feedbackType: true,
				},
				where: {
					userId: user.id,
					resourceId: { in: records.map(record => record.id) },
					resourceType: 'reddit_post_suggestion'
				}
			});

			logger.info('userFeedbacks', userFeedbacks);

			// 创建反馈映射，方便快速查找
			const feedbackMap: Record<string, { thumbsUp: boolean; thumbsDown: boolean }> = {};
			// recordIds.forEach(id => {
			// 	feedbackMap[id] = { thumbsUp: false, thumbsDown: false };
			// });

			// 填充反馈映射
			userFeedbacks.forEach(feedback => {
				if (!feedbackMap[feedback.resourceId]) {
					feedbackMap[feedback.resourceId] = { thumbsUp: false, thumbsDown: false };
				}
				if (feedback.feedbackType === 1) {
					feedbackMap[feedback.resourceId].thumbsUp = true;
				} else if (feedback.feedbackType === 2) {
					feedbackMap[feedback.resourceId].thumbsDown = true;
				}
			});

			logger.info('feedbackMap', feedbackMap);

			// 转换数据结构，从result字段中提取reason，确保result是一个有效的JSON对象
			const transformedRecords = records.map(record => {
				const aiRecord = record.aiAnalyzeRecords[0]; // 假设每个post只有一个分析记录
				const feedback = feedbackMap[record.id];
				return {
					...record,
					aiAnalyzeRecords: aiRecord ? [{
						confidence: aiRecord.confidence,
						result: {
							// 添加类型检查确保result是对象且有reason属性
							reason: typeof aiRecord.result === 'object' && aiRecord.result !== null && 'reason' in aiRecord.result 
								? String(aiRecord.result.reason) 
								: ""
						}
					}] : [],
					userFeedback: feedback 
				};
			});

			const total = await db.redditPost.count({
				where: {
					categoryId: {
						in: categoryArray
					},
					aiAnalyzeRecords: {
						some: {
							userId: user.id,
							confidence: {
								gte: embeddingRate
							}
						}
					}
				}
			});
			  

			return c.json({
				records: transformedRecords,
				total,
			});
		},
	);
	
