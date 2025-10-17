import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

import { utcnow } from "@repo/utils";
import { authMiddleware } from "../../middleware/auth";
import { AgentSettingCreateInput, AgentSettingUpdateInput } from "./types";
import { openaiService, promptLeadAgentSubreddit, promptLeadAgentQuery} from "@repo/ai";
import { nanoid } from "nanoid";

export const agentSettingRouter = new Hono()
	.basePath("/agent-setting")
	.use(authMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().optional(),
				userId: z.string().optional(),
				organizationId: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get all agent-setting",
			tags: ["AgentSetting"],
		}),
		async (c) => {
			const { query, userId, organizationId } = c.req.valid("query");
			const page = parseInt(c.req.query("page") || "1");
			const pageSize = parseInt(c.req.query("pageSize") || "10");
			const offset = (page - 1) * pageSize;

			// 查询当前页数据
			const records = await db.agentSetting.findMany({
			});

			// 单独查询总记录数
			const total = await db.agentSetting.count();

			return c.json({
				records,
				total,
			});
		},
	)
	.post(
		"/generate-prompt",
		validator("json", z.object({
			description: z.string(),
		})),
		describeRoute({
			summary: "Generate prompt",
			tags: ["AgentSetting Generate-prompt"],
		}),
		async (c) => {
			const { description } = c.req.valid("json");
			const user = c.get("user");
			const promptSubreddit = promptLeadAgentSubreddit(description);
			const responseSubreddit = await openaiService.generateText('subreddit-prompt', promptSubreddit, {
				model: 'gpt-4.1',
				temperature: 0.7,
				userId: user.id, 
			});
			if (!responseSubreddit) {
				return c.json({ error: "Failed to generate prompt" }, 500);
			}

			const promptQuery = promptLeadAgentQuery(description);
			const responseQuery = await openaiService.generateText('query-prompt', promptQuery, {
				model: 'gpt-4.1',
				temperature: 0.7,
				userId: user.id, 
			});
			if (!responseQuery) {
				return c.json({ error: "Failed to generate prompt" }, 500);
			}
			return c.json({ subreddit: responseSubreddit, query: responseQuery });
		},
	)
	.get(
		"/my",
		describeRoute({
			summary: "Get agent-setting by user ID",
			tags: ["AgentSetting"],
		}),
		async (c) => {
			const user = c.get("user");
			const record = await db.agentSetting.findUnique({
				where: { userId: user.id },
			});

			if (!record) {
				return c.json({ error: "AgentSetting not found" }, 404);
			}

			return c.json(record);
		},
	)
	.post(
		"/",
		validator("json", AgentSettingCreateInput),
		describeRoute({
			summary: "Create new agent-setting",
			tags: ["AgentSetting"],
		}),
		async (c) => {
			try {
				const rawData = c.req.valid("json");
				const user = c.get("user");
				// const embedding = await openaiService.generateEmbedding('query-embedding', user.id, rawData.query);
				// if (!embedding) {
				// 	return c.json({ error: "Failed to generate embedding" }, 500);
				// }

				// 创建包含所有必要字段的新对象
				const agentSettingData = {
					...rawData,
					id: nanoid(),
					userId: user.id,
					// embedding: embedding,
				};

				// 直接从 agentSettingData 创建返回对象，完全避免类型推断问题
				const responseData = {
					id: agentSettingData.id,
					userId: agentSettingData.userId,
					description: agentSettingData.description,
					subreddit: agentSettingData.subreddit,
					query: agentSettingData.query,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};

				await db.agentSetting.create({
					data: agentSettingData,
				});

				// 执行数据库操作，但不依赖返回值的类型
				// await db.$queryRaw`
				// 	INSERT INTO agent_setting (
				// 	"id",
				// 	"userId",
				// 	"description",
				// 	"subreddit",
				// 	"query",
				// 	"embedding",
				// 	"createdAt",
				// 	"updatedAt"
				// 	) VALUES (
				// 	${agentSettingData.id},
				// 	${agentSettingData.userId},
				// 	${agentSettingData.description},
				// 	${agentSettingData.subreddit},
				// 	${agentSettingData.query},
				// 	${agentSettingData.embedding}::vector,
				// 	NOW(),
				// 	NOW()
				// 	) RETURNING 
				// 		"id",
				// 	"userId",
				// 	"description",
				// 	"subreddit",
				// 	"query"
				// `;


				const subreddit = rawData.subreddit;
				const subredditArray = subreddit?.split(',') || [];
				// 检查category 中是否有subredditArray的数据。 如果没有，则插入一条记录
				const categoryRecords = await db.category.findMany();
				// 排除已经存在的category, 首尾去空格
				const existingCategoryPaths = categoryRecords?.map(category => category.path.trim()) || [];
				const newSubredditArray = subredditArray.filter(subreddit => !existingCategoryPaths.includes(subreddit.trim())).map(subreddit => ({
					name: subreddit.trim(),
					path: subreddit.trim(),
					platform: 'reddit',
				}));

				if (newSubredditArray.length > 0) {
					try {
						// 插入新的category
						const newCategory = await db.category.createMany({
							data: newSubredditArray,
						});
					} catch (e) {
						return c.json(
							{
								error: "Failed to create category",
								details: e?.toString(),
							},
							500,
						);
					}
				}

				return c.json(responseData, 201);
			} catch (e) {
				return c.json(
					{
						error: "Failed to create agent-setting",
						details: e?.toString(),
					},
					500,
				);
			}
		},
	)
	
	.put(
		"/:id",
		validator("json", AgentSettingCreateInput),
		describeRoute({
			summary: "Replace agent-setting",
			tags: ["AgentSetting"],
		}),
		async (c) => {
			try {
				const id = c.req.param("id");
				const rawData = c.req.valid("json");
				const user = c.get("user");

				// 创建包含所有必要字段的新对象
				const agentSettingData = {
					...rawData,
				};

				// 使用queryRaw并手动处理类型
				const result = await db.agentSetting.findUnique({
					where: { id },
				});
				// 处理类型和结果检查
				if (!result) {
					return c.json({ error: "AgentSetting not found" }, 404);
				}

				await db.agentSetting.update({
					where: { id },
					data: {
						description: agentSettingData.description,
						subreddit: agentSettingData.subreddit,
						query: agentSettingData.query,
						updatedAt: new Date().toISOString(),
					},
				});


				// 直接从agentSettingData构建返回对象，避免类型推断问题
				const updatedAgentSetting = {
					...agentSettingData,
					id: id,
					updatedAt: new Date().toISOString()
				};

				const subreddit = rawData.subreddit;
				const subredditArray = subreddit?.split(',') || [];
				// 检查category 中是否有subredditArray的数据。 如果没有，则插入一条记录
				const categoryRecords = await db.category.findMany();
				// 排除已经存在的category, 首尾去空格
				const existingCategoryPaths = categoryRecords?.map(category => category.path.trim()) || [];
				const newSubredditArray = subredditArray.filter(subreddit => !existingCategoryPaths.includes(subreddit.trim())).map(subreddit => ({
					name: subreddit.trim(),
					path: subreddit.trim(),
					platform: 'reddit',
				}));

				if (newSubredditArray.length > 0) {
					try {
						// 插入新的category
						const newCategory = await db.category.createMany({
							data: newSubredditArray,
						});
					} catch (e) {
						return c.json(
							{
								error: "Failed to create category",
								details: e?.toString(),
							},
							500,
						);
					}
				}

				return c.json(updatedAgentSetting);
			} catch (e) {
				return c.json(
					{
						error: "Failed to update agent-setting",
						details: e?.toString(),
					},
					500,
				);
			}
		},
	);
