import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import {
	CategorySchema,
} from "./types";

export const leadAgentCategoryRouter = new Hono()
	.basePath("/leadAgent-categories")
	.use(authMiddleware)
	.get(
		"/",
		describeRoute({
			summary: "Get all leadAgent categories",
			tags: ["LeadAgentCategory"],	
		}),
		validator(
			"query",
			z.object({ organizationId: z.string().optional() }).optional(),
		),
		async (c) => {
			const query = c.req.valid("query") || {};
			const categories = await db.category.findMany({
				select: {
					id: true,
					name: true,
					path: true,
					platform: true,
					createdAt: true,
					updatedAt: true,
				}
				// orderBy: [asc(category.id)]
			});

			// return c.json(
			// 	categories.map((category) => ({
			// 		...category,
			// 		subscriptionCount: category._count?.subscriptions || 0,
			// 	})),
			// );
			return c.json(categories);
		},
	)
	.get(
		"/select",
		describeRoute({
			summary: "Get all subscription categories",
			tags: ["SubscriptionCategory"],
		}),
		validator(
			"query",
			z.object({ organizationId: z.string().optional() }).optional(),
		),
		async (c) => {
			const query = c.req.valid("query") || {};
			const categories = await db.category.findMany({
				// orderBy: { name: "asc" },
			});

			return c.json(CategorySchema.array().parse(categories));
		},
	)
	// .get(
	// 	"/subscription-count",
	// 	validator(
	// 		"query",
	// 		z.object({
	// 			organizationId: z.string().optional(),
	// 		}),
	// 	),
	// 	describeRoute({
	// 		summary: "Get subscription count for all category",
	// 		tags: ["SubscriptionCategory"],
	// 	}),
	// 	async (c) => {
	// 		const { organizationId } = c.req.valid("query");
	// 		const count = await db.query.subscription.count({
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
	// 	validator("json", CategoryCreateInput),
	// 	describeRoute({
	// 		summary: "Create new subscription category",
	// 		tags: ["SubscriptionCategory"],
	// 	}),
	// 	async (c) => {
	// 		const { name, organizationId } = c.req.valid("json");
	// 		const user = c.get("user");

	// 		if (organizationId) {
	// 			await verifyOrganizationMembership(organizationId, user.id);
	// 		}
	// 		const category = await db.category.create({
	// 			data: {
	// 				name,
	// 				userId: user.id,
	// 				organizationId,
	// 			},
	// 		});
	// 		return c.json(category, 201);
	// 	},
	// )
	// .patch(
	// 	"/:id",
	// 	validator("json", CategoryUpdateInput),
	// 	describeRoute({
	// 		summary: "Update subscription category",
	// 		tags: ["SubscriptionCategory"],
	// 	}),
	// 	async (c) => {
	// 		const id = c.req.param("id");
	// 		const { name, organizationId } = c.req.valid("json");

	// 		const user = c.get("user");
	// 		if (organizationId) {
	// 			await verifyOrganizationMembership(organizationId, user.id);
	// 		}

	// 		const category = await db.category.update({
	// 			where: { id },
	// 			data: {
	// 				name,
	// 			},
	// 		});
	// 		return c.json(category);
	// 	},
	// )
	// .delete(
	// 	"/:id",
	// 	describeRoute({
	// 		summary: "Delete subscription category",
	// 		tags: ["SubscriptionCategory"],
	// 	}),
	// 	async (c) => {
	// 		const id = c.req.param("id");
	// 		await db.category.delete({ where: { id } });
	// 		return c.json({ success: true });
	// 	},
	// )
	// ;
