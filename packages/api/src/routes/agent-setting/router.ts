import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { verifyOrganizationMembership } from "../organizations/lib/membership";

import { utcnow } from "@repo/utils";
import { authMiddleware } from "../../middleware/auth";
import { AgentSettingCreateInput, AgentSettingUpdateInput } from "./types";
import { desc, eq, inArray } from "drizzle-orm";
import { agentSetting, category } from "@repo/database/drizzle/schema";
import { openaiService, promptLeadAgentSubreddit, promptLeadAgentQuery} from "@repo/ai";

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
			const records = await db.query.agentSetting.findMany({
				orderBy: [desc("createdAt")], // 修正排序字段名
				limit: pageSize,
				offset,

			});

			// 单独查询总记录数
			const total = await db.$count(agentSetting);

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
			const responseSubreddit = await openaiService.generateText(promptSubreddit, {
				model: 'gpt-3.5-turbo',
				temperature: 0.7,
				userId: user.id, 
			});
			console.log('提示:', promptSubreddit);
			console.log('响应:', responseSubreddit);
			if (!responseSubreddit) {
				return c.json({ error: "Failed to generate prompt" }, 500);
			}

			const promptQuery = promptLeadAgentQuery(description);
			const responseQuery = await openaiService.generateText(promptQuery, {
				model: 'gpt-3.5-turbo',
				temperature: 0.7,
				userId: user.id, 
			});
			console.log('提示:', promptQuery);
			console.log('响应:', responseQuery);
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
			const record = await db.query.agentSetting.findFirst({
				where: eq(agentSetting.userId, user.id)
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
				rawData.userId = user.id;

				const agentSettingRecord = await db.insert(agentSetting).values(rawData);

				const subreddit = rawData.subreddit;
				const subredditArray = subreddit?.split(',') || [];
				// 检查category 中是否有subredditArray的数据。 如果没有，则插入一条记录
				const categoryRecords = await db.query.category.findMany({
					where: inArray(category.path, subredditArray)
				});
				// 排除已经存在的category
				const existingCategoryNames = categoryRecords?.map(category => category.name) || [];
				const newSubredditArray = subredditArray.filter(subreddit => !existingCategoryNames.includes(subreddit)).map(subreddit => ({
					name: subreddit,
					userId: user.id,
					path: subreddit,
					platform: 'reddit',
				}));

				if (newSubredditArray.length > 0) {
					// 插入新的category
					const newCategory = await db.insert(category).values(newSubredditArray);
				}


				return c.json(agentSettingRecord, 201);
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
	.patch(
		"/:id",
		validator("json", AgentSettingUpdateInput),
		describeRoute({
			summary: "Update agent-setting",
			tags: ["AgentSetting"],
		}),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");

			const user = c.get("user");
			if (data.organizationId) {
				await verifyOrganizationMembership(
					data.organizationId,
					user.id,
				);
			}

			const existing = await db.agentSetting.findUnique({
				where: { id },
			});
			if (!existing) {
				return c.json({ error: "AgentSetting not found" }, 404);
			}

			const { tags = [], ...cleanData } = data;
				const agentSettingTags = tags.map((tagId) => ({ tagId }));
				const agentSetting = await db.agentSetting.update({
					where: { id },
					data: {
						...cleanData,
						updatedAt: utcnow(),
						agentSettingTags: {
							deleteMany: {},
							create: agentSettingTags,
						},
					}
				});

			return c.json(agentSetting);
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

				const existing = await db.query.agentSetting.findFirst({
					where: eq(agentSetting.id, id),
				});
				if (!existing) {
					return c.json({ error: "AgentSetting not found" }, 404);
				}


				const updatedAgentSetting = await db.update(agentSetting).set({
					...rawData,
					updatedAt: utcnow(),
				}).where(eq(agentSetting.id, id)).returning();

				const subreddit = rawData.subreddit;
				const subredditArray = subreddit?.split(',') || [];
				// 检查category 中是否有subredditArray的数据。 如果没有，则插入一条记录
				const categoryRecords = await db.query.category.findMany({
					where: inArray(category.path, subredditArray)
				});
				// 排除已经存在的category
				const existingCategoryNames = categoryRecords?.map(category => category.name) || [];
				const newSubredditArray = subredditArray.filter(subreddit => !existingCategoryNames.includes(subreddit)).map(subreddit => ({
					name: subreddit,
					path: subreddit,
					platform: 'reddit',
				}));

				if (newSubredditArray.length > 0) {
					// 插入新的category
					const newCategory = await db.insert(category).values(newSubredditArray);
				}

				return c.json(updatedAgentSetting);
			} catch (e) {
				return c.json(
					{
						error: "Failed to update agent-setting",
						details: e?.toString(),
					},
					400,
				);
			}
		},
	)	
	.delete(
		"/:id",
		describeRoute({
			summary: "Delete agent-setting",
			tags: ["AgentSetting"],
		}),
		async (c) => {
			const id = c.req.param("id");
			await db.agentSetting.delete({
				where: {
					id,
				},
			});
			return c.json({ success: true });
		},
	);
