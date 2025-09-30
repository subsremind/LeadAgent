import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";

import { authMiddleware } from "../../middleware/auth";
import { logger } from "@repo/logs";
import { AgentSettingQueryType } from "./types";

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

			

			// 2. 使用pgvector进行向量搜索
			const records = await db.redditPost.findMany({
			});

			

			return c.json({
				records
			});
		},
	)
	.post(
		"/search",
		validator(
			"json",
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(10),
				embeddingRate: z.number().default(0.7),
			}),
		),
		describeRoute({
			summary: "Search lead-agent using vector search",
			tags: ["LeadAgent"],
		}),
		async (c) => {
			const { embeddingRate, page, pageSize } = c.req.valid("json");
			const user = c.get("user");
			const agentSetting: AgentSettingQueryType = {
				subreddit: "",
				embedding: "",
			};
			try {
				const result = await db.$queryRaw`
				SELECT id, "userId", description, subreddit, query, embedding::text as embedding,
						"createdAt", "updatedAt"
				FROM agent_setting
				WHERE "userId" = ${user.id}
				LIMIT 1`;
				if (Array.isArray(result) && result.length > 0) {
					const agentSettingRecord = result[0];
					if (agentSettingRecord) {
						agentSetting.subreddit = agentSettingRecord.subreddit;
						agentSetting.embedding = JSON.parse(agentSettingRecord.embedding);
					}
				}
			} catch (error) {
				logger.error("Error fetching agent setting: ", error);
				return c.json({ error: "Internal server error" }, 500);
			}
			// const agentSetting = await db.agentSetting.findUnique({
			// 	where: { userId: user.id },
			// 	select: {
			// 		id: true,
			// 		userId: true,
			// 		description: true,
			// 		subreddit: true,
			// 		query: true,
			// 		embedding: true,
			// 		createdAt: true,
			// 		updatedAt: true
			// 	  }
			// });
			if (!agentSetting) {
				return c.json({ records: [], total: 0, message: "Agent setting not found" });
			}
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
			  
			//   // 如果只需要id值的数组，可以进一步处理
			//   const ids = categoryIds.map(cat => cat.id);
			if (!categoryIds.length) {
				return c.json({ error: "Subreddit not found" }, 404);
			}

			const categoryArray = categoryIds.map((item) => item.id);

			const offset = (page - 1) * pageSize;	

			// 查询当前页数据
			let records;
			let total;

			// 检查 embedding 参数是否存在
			if (!agentSetting?.embedding || !Array.isArray(agentSetting?.embedding)) {
				return c.json({
					records: [],
					total: 0,
					message: "embedding not found",
				});
			}

			// 1. 生成查询文本的向量表示
			// const embedding = await openaiService.generateQueryEmbedding(query);
			// 2. 使用pgvector进行向量搜索
			try {
				records = await db.$queryRawUnsafe(`
				SELECT
				  id,
				  "categoryId",
				  "redditId",
				  title,
				  selftext,
				  url,
				  permalink,
				  author,
				  subreddit,
				  ups,
				  downs,
				  score,
				  "numComments",
				  "createdUtc"
				FROM "reddit_post"
				WHERE "categoryId" = ANY($1)
				  AND embedding <=> $2::vector < $3
				ORDER BY "createdUtc" DESC
				LIMIT $4
				OFFSET $5
			  `, categoryArray, `[${agentSetting?.embedding.join(',')}]`, embeddingRate, pageSize, offset);
				} catch (error) {
					logger.error("Error fetching posts: ", error);
					return c.json({ error: "Internal server error" }, 500);
				}
			  
			  // 查询总数
			const totalResult = await db.$queryRawUnsafe<{ count: bigint }>(`
			SELECT COUNT(*) AS count
			FROM   "reddit_post"
			WHERE  "categoryId" = ANY($1)
				AND  embedding <=> $2::vector < $3
			`, categoryArray,
				`[${agentSetting.embedding.join(',')}]`,
				embeddingRate);
			
			total = Number(Array.isArray(totalResult) ? totalResult[0].count : totalResult.count);

			return c.json({
				records,
				total,
			});
		},
	)
	// .get(
	// 	"/:id",
	// 	describeRoute({
	// 		summary: "Get reddit post by ID",
	// 		tags: ["RedditPost"],
	// 	}),
	// 	async (c) => {
	// 		const id = c.req.param("id");
	// 		const record = await db.query.redditPost.findFirst({
	// 			where: eq(redditPost.id, id)
	// 		});

	// 		if (!record) {
	// 			return c.json({ error: "Reddit post not found" }, 404);
	// 		}

	// 		return c.json(record);
	// 	},
	// )
	// .post(
	// 	"/count",
	// 	validator(
	// 		"query",
	// 		z.object({
	// 			organizationId: z.string().optional(),
	// 		}),
	// 	),
	// 	describeRoute({
	// 		summary: "Get all subscriptions count",
	// 		tags: ["Subscription"],
	// 	}),
	// 	async (c) => {
	// 		const { organizationId } = c.req.valid("query");
	// 		const count = await db.query.redditPost.count({
	// 			where: {
	// 				...(organizationId
	// 					? { organizationId }
	// 					: {
	// 							userId: c.get("user").id,
	// 							organizationId: null,
	// 						}),
	// 			},
	// 		});
	// 		return c.json({ count: count });
	// 	},
	// )
	// .post(
	// 	"/",
	// 	validator("json", SubscriptionCreateInput),
	// 	describeRoute({
	// 		summary: "Create new subscription",
	// 		tags: ["Subscription"],
	// 	}),
	// 	async (c) => {
	// 		try {
	// 			const rawData = c.req.valid("json");
	// 			const user = c.get("user");
	// 			const {
	// 				tags = [],
	// 				categoryId,
	// 				organizationId,
	// 				...cleanRawData
	// 			} = rawData;

	// 			if (organizationId) {
	// 				await verifyOrganizationMembership(organizationId, user.id);
	// 			}

	// 			const subscriptionTags = tags.map((tagId) => ({
	// 				tagId: tagId,
	// 			}));

	// 			const data = {
	// 				...cleanRawData,
	// 				organization: organizationId
	// 					? { connect: { id: organizationId } }
	// 					: undefined,
	// 				user: { connect: { id: user.id } },
	// 				category: categoryId
	// 					? { connect: { id: categoryId } }
	// 					: undefined,
	// 				subscriptionTags:
	// 					subscriptionTags.length > 0
	// 						? { create: subscriptionTags }
	// 						: undefined,
	// 			};

	// 			const subscription = await db.subscription.create({ data });
	// 			return c.json(subscription, 201);
	// 		} catch (e) {
	// 			return c.json(
	// 				{
	// 					error: "Failed to create subscription",
	// 					details: e?.toString(),
	// 				},
	// 				500,
	// 			);
	// 		}
	// 	},
	// )
	// .patch(
	// 	"/:id",
	// 	validator("json", SubscriptionUpdateInput),
	// 	describeRoute({
	// 		summary: "Update subscription",
	// 		tags: ["Subscription"],
	// 	}),
	// 	async (c) => {
	// 		const id = c.req.param("id");
	// 		const data = c.req.valid("json");

	// 		const user = c.get("user");
	// 		if (data.organizationId) {
	// 			await verifyOrganizationMembership(
	// 				data.organizationId,
	// 				user.id,
	// 			);
	// 		}

	// 		const existing = await db.subscription.findUnique({
	// 			where: { id },
	// 		});
	// 		if (!existing) {
	// 			return c.json({ error: "Subscription not found" }, 404);
	// 		}

	// 		const { tags = [], ...cleanData } = data;
	// 			const subscriptionTags = tags.map((tagId) => ({ tagId }));
	// 			const subscription = await db.subscription.update({
	// 				where: { id },
	// 				data: {
	// 					...cleanData,
	// 					updatedAt: utcnow(),
	// 					subscriptionTags: {
	// 						deleteMany: {},
	// 						create: subscriptionTags,
	// 					},
	// 				}
	// 			});

	// 		return c.json(subscription);
	// 	},
	// )
	// .put(
	// 	"/:id",
	// 	validator("json", SubscriptionCreateInput),
	// 	describeRoute({
	// 		summary: "Replace subscription",
	// 		tags: ["Subscription"],
	// 	}),
	// 	async (c) => {
	// 		try {
	// 			const id = c.req.param("id");
	// 			const rawData = c.req.valid("json");
	// 			const user = c.get("user");

	// 			const existing = await db.subscription.findUnique({
	// 				where: { id },
	// 			});
	// 			if (!existing) {
	// 				return c.json({ error: "Subscription not found" }, 404);
	// 			}

	// 			const { tags = [], ...cleanRawData } = rawData;
	// 			const subscriptionTags = tags.map((tagId) => ({ tagId }));

	// 			const subscription = await db.subscription.update({
	// 				where: {
	// 					id,
	// 				},
	// 				data: {
	// 					...cleanRawData,
	// 					updatedAt: utcnow(),
	// 					categoryId:
	// 						rawData.categoryId === ""
	// 							? null
	// 							: rawData.categoryId,
	// 					subscriptionTags: {
	// 						deleteMany: {},
	// 						create: subscriptionTags,
	// 					},
	// 				},
	// 			});

	// 			const changes = [];
	// 			const fieldsToCompare = [
	// 				"company",
	// 				"description",
	// 				"frequency",
	// 				"value",
	// 				"currency",
	// 				"cycle",
	// 				"type",
	// 				"recurring",
	// 				"categoryId",
	// 				"contractExpiry",
	// 				"nextPaymentDate",
	// 				"urlLink",
	// 				"notesIncluded",
	// 			];

	// 			for (const field of fieldsToCompare) {
	// 				const existingFieldValue = (existing as Record<string, any>)[field];
	// 				const subscriptionFieldValue = (subscription as Record<string, any>)[field];

	// 				if (String(existingFieldValue) !== String(subscriptionFieldValue)
	// 				) {
	// 					changes.push({
	// 						field,
	// 						fromValue: String(existingFieldValue),
	// 						toValue: String(subscriptionFieldValue),
	// 					});
	// 				}
	// 			}

	// 			if (changes.length > 0) {
	// 				await Promise.all(
	// 					changes.map(async (change) => {
	// 						await db.editHistory.create({
	// 							data: {
	// 								createdBy: user.name,
	// 								tableName: "subscription",
	// 								tableField: change.field,
	// 								tableId: id,
	// 								fromValue: change.fromValue,
	// 								toValue: change.toValue,
	// 							},
	// 						});
	// 					}),
	// 				);
	// 			}

	// 			return c.json(subscription);
	// 		} catch (e) {
	// 			return c.json(
	// 				{
	// 					error: "Failed to update subscription",
	// 					details: e?.toString(),
	// 				},
	// 				400,
	// 			);
	// 		}
	// 	},
	// )
	// .delete(
	// 	"/:id",
	// 	describeRoute({
	// 		summary: "Delete subscription",
	// 		tags: ["Subscription"],
	// 	}),
	// 	async (c) => {
	// 		const id = c.req.param("id");
	// 		await db.subscription.delete({
	// 			where: {
	// 				id,
	// 			},
	// 		});
	// 		return c.json({ success: true });
	// 	},
	// )
	// 
	// ;
