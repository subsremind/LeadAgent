import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { verifyOrganizationMembership } from "../organizations/lib/membership";

import { utcnow } from "@repo/utils";
import { authMiddleware } from "../../middleware/auth";
import { SubscriptionCreateInput, SubscriptionUpdateInput } from "./types";
import { desc, eq, sql } from "drizzle-orm";
import { redditPost } from "@repo/database/drizzle/schema";
import { openaiService, promptLeadAgentSubreddit, promptLeadAgentQuery} from "@repo/ai";

export const leadAgentRouter = new Hono()
	.basePath("/lead-agent")
	.use(authMiddleware)
	.get(
		"/",
		validator(
			"query",
			z.object({
				query: z.string().nonempty("Query is required"),
				categoryId: z.string().optional(),
				organizationId: z.string().optional(),
				page: z.string().optional(),
				pageSize: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get all lead-agent",
			tags: ["LeadAgent"],
		}),
		async (c) => {
			const { query, categoryId, organizationId, page, pageSize } = c.req.valid("query");
			const pageNum = parseInt(page || "1");
			const pageSizeNum = parseInt(pageSize || "10");
			const offset = (pageNum - 1) * pageSizeNum;

			// 查询当前页数据
			let records;
			let total;

			// 1. 生成查询文本的向量表示
			const embedding = await openaiService.generateQueryEmbedding(query);

			// 2. 使用pgvector进行向量搜索
			records = await db.query.redditPost.findMany({
				orderBy: [sql`${redditPost.embedding} <-> ${sql.raw(JSON.stringify(embedding))}`], // 余弦相似度排序
				limit: pageSizeNum,
				offset,
			});

			// 单独查询总记录数
			total = await db.$count(redditPost, {
				where: categoryId ? eq(redditPost.categoryId, categoryId) : undefined
			});

			return c.json({
				records,
				total,
			});
		},
	)
	.post(
		"/search",
		validator(
			"json",
			z.object({
				query: z.string().nonempty("Query is required"),
				categoryId: z.string().optional(),
				organizationId: z.string().optional(),
				page: z.number().default(1),
				pageSize: z.number().default(10),
			}),
		),
		describeRoute({
			summary: "Search lead-agent using vector search",
			tags: ["LeadAgent"],
		}),
		async (c) => {
			const { query, categoryId, organizationId, page, pageSize } = c.req.valid("json");
			const offset = (page - 1) * pageSize;	

			// 查询当前页数据
			let records;
			let total;

			// 1. 生成查询文本的向量表示
			const embedding = await openaiService.generateQueryEmbedding(query);

			// 2. 使用pgvector进行向量搜索
			records = await db.query.redditPost.findMany({
				columns: {
					id: true,
					categoryId: true,
					redditId: true,
					title: true,
					selftext: true,
					url: true,
					permalink: true,
					author: true,
					subreddit: true,
					ups: true,
					downs: true,
					score: true,
					numComments: true,
					createdUtc: true,
				},
				where: sql`${redditPost.embedding} <=> ARRAY[${sql.raw(embedding.join(', '))}]::vector > 0.5`,
				orderBy: [
					desc(redditPost.createdUtc)], // 余弦相似度排序
				// orderBy: [desc(redditPost.createdUtc)],
				limit: pageSize,
				offset,
			});

			// 单独查询总记录数
			total = await db.$count(redditPost,sql`${redditPost.embedding} <=> ARRAY[${sql.raw(embedding.join(', '))}]::vector > 0.5`);

			return c.json({
				records,
				total,
			});
		},
	)
	.get(
		"/:id",
		describeRoute({
			summary: "Get reddit post by ID",
			tags: ["RedditPost"],
		}),
		async (c) => {
			const id = c.req.param("id");
			const record = await db.query.redditPost.findMany({
				where: eq(redditPost.id, id)
			});

			if (!record) {
				return c.json({ error: "Reddit post not found" }, 404);
			}

			return c.json(record);
		},
	)
	.post(
		"/count",
		validator(
			"query",
			z.object({
				organizationId: z.string().optional(),
			}),
		),
		describeRoute({
			summary: "Get all subscriptions count",
			tags: ["Subscription"],
		}),
		async (c) => {
			const { organizationId } = c.req.valid("query");
			const count = await db.query.redditPost.count({
				where: {
					...(organizationId
						? { organizationId }
						: {
								userId: c.get("user").id,
								organizationId: null,
							}),
				},
			});
			return c.json({ count: count });
		},
	)
	.post(
		"/",
		validator("json", SubscriptionCreateInput),
		describeRoute({
			summary: "Create new subscription",
			tags: ["Subscription"],
		}),
		async (c) => {
			try {
				const rawData = c.req.valid("json");
				const user = c.get("user");
				const {
					tags = [],
					categoryId,
					organizationId,
					...cleanRawData
				} = rawData;

				if (organizationId) {
					await verifyOrganizationMembership(organizationId, user.id);
				}

				const subscriptionTags = tags.map((tagId) => ({
					tagId: tagId,
				}));

				const data = {
					...cleanRawData,
					organization: organizationId
						? { connect: { id: organizationId } }
						: undefined,
					user: { connect: { id: user.id } },
					category: categoryId
						? { connect: { id: categoryId } }
						: undefined,
					subscriptionTags:
						subscriptionTags.length > 0
							? { create: subscriptionTags }
							: undefined,
				};

				const subscription = await db.subscription.create({ data });
				return c.json(subscription, 201);
			} catch (e) {
				return c.json(
					{
						error: "Failed to create subscription",
						details: e?.toString(),
					},
					500,
				);
			}
		},
	)
	.patch(
		"/:id",
		validator("json", SubscriptionUpdateInput),
		describeRoute({
			summary: "Update subscription",
			tags: ["Subscription"],
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

			const existing = await db.subscription.findUnique({
				where: { id },
			});
			if (!existing) {
				return c.json({ error: "Subscription not found" }, 404);
			}

			const { tags = [], ...cleanData } = data;
				const subscriptionTags = tags.map((tagId) => ({ tagId }));
				const subscription = await db.subscription.update({
					where: { id },
					data: {
						...cleanData,
						updatedAt: utcnow(),
						subscriptionTags: {
							deleteMany: {},
							create: subscriptionTags,
						},
					}
				});

			return c.json(subscription);
		},
	)
	.put(
		"/:id",
		validator("json", SubscriptionCreateInput),
		describeRoute({
			summary: "Replace subscription",
			tags: ["Subscription"],
		}),
		async (c) => {
			try {
				const id = c.req.param("id");
				const rawData = c.req.valid("json");
				const user = c.get("user");

				const existing = await db.subscription.findUnique({
					where: { id },
				});
				if (!existing) {
					return c.json({ error: "Subscription not found" }, 404);
				}

				const { tags = [], ...cleanRawData } = rawData;
				const subscriptionTags = tags.map((tagId) => ({ tagId }));

				const subscription = await db.subscription.update({
					where: {
						id,
					},
					data: {
						...cleanRawData,
						updatedAt: utcnow(),
						categoryId:
							rawData.categoryId === ""
								? null
								: rawData.categoryId,
						subscriptionTags: {
							deleteMany: {},
							create: subscriptionTags,
						},
					},
				});

				const changes = [];
				const fieldsToCompare = [
					"company",
					"description",
					"frequency",
					"value",
					"currency",
					"cycle",
					"type",
					"recurring",
					"categoryId",
					"contractExpiry",
					"nextPaymentDate",
					"urlLink",
					"notesIncluded",
				];

				for (const field of fieldsToCompare) {
					const existingFieldValue = (existing as Record<string, any>)[field];
					const subscriptionFieldValue = (subscription as Record<string, any>)[field];

					if (String(existingFieldValue) !== String(subscriptionFieldValue)
					) {
						changes.push({
							field,
							fromValue: String(existingFieldValue),
							toValue: String(subscriptionFieldValue),
						});
					}
				}

				if (changes.length > 0) {
					await Promise.all(
						changes.map(async (change) => {
							await db.editHistory.create({
								data: {
									createdBy: user.name,
									tableName: "subscription",
									tableField: change.field,
									tableId: id,
									fromValue: change.fromValue,
									toValue: change.toValue,
								},
							});
						}),
					);
				}

				return c.json(subscription);
			} catch (e) {
				return c.json(
					{
						error: "Failed to update subscription",
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
			summary: "Delete subscription",
			tags: ["Subscription"],
		}),
		async (c) => {
			const id = c.req.param("id");
			await db.subscription.delete({
				where: {
					id,
				},
			});
			return c.json({ success: true });
		},
	);
