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
				orderBy: [desc(agentSetting.createdAt)], // 使用表定义中的列
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
				model: 'gpt-4.1',
				temperature: 0.7,
				userId: user.id, 
			});
			if (!responseSubreddit) {
				return c.json({ error: "Failed to generate prompt" }, 500);
			}

			const promptQuery = promptLeadAgentQuery(description);
			const responseQuery = await openaiService.generateText(promptQuery, {
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
				const embedding = await openaiService.generateQueryEmbedding(rawData.query);

				// 创建包含所有必要字段的新对象
				const agentSettingData = {
					...rawData,
					userId: user.id,
					embedding
				};

				const agentSettingRecord = await db.insert(agentSetting).values(agentSettingData);

				const subreddit = rawData.subreddit;
				const subredditArray = subreddit?.split(',') || [];
				// 检查category 中是否有subredditArray的数据。 如果没有，则插入一条记录
				const categoryRecords = await db.query.category.findMany();
				// 排除已经存在的category, 首尾去空格
				const existingCategoryPaths = categoryRecords?.map(category => category.path.trim()) || [];
				const newSubredditArray = subredditArray.filter(subreddit => !existingCategoryPaths.includes(subreddit.trim())).map(subreddit => ({
					name: subreddit.trim(),
					path: subreddit.trim(),
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
			const embedding = await openaiService.generateQueryEmbedding(rawData.query);

			// 创建包含所有必要字段的新对象
			const agentSettingData = {
				...rawData,
				embedding
			};

				const existing = await db.query.agentSetting.findFirst({
				where: (setting, { eq }) => eq(setting.id, parseInt(id)),
			});
				if (!existing) {
					return c.json({ error: "AgentSetting not found" }, 404);
				}


				const updatedAgentSetting = await db.update(agentSetting).set({
				...agentSettingData,
				updatedAt: utcnow(),
				}).where(eq(agentSetting.id, parseInt(id))).returning();

				const subreddit = rawData.subreddit;
				const subredditArray = subreddit?.split(',') || [];
				// 检查category 中是否有subredditArray的数据。 如果没有，则插入一条记录
				const categoryRecords = await db.query.category.findMany();
				// 排除已经存在的category, 首尾去空格
				const existingCategoryPaths = categoryRecords?.map(category => category.path.trim()) || [];
				const newSubredditArray = subredditArray.filter(subreddit => !existingCategoryPaths.includes(subreddit.trim())).map(subreddit => ({
					name: subreddit.trim(),
					path: subreddit.trim(),
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
	);
