import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { logger } from "@repo/logs";


export const aiPromptRouter = new Hono()
	.basePath("/aiPrompt")
	.use(adminMiddleware) 
	.get(
		"/",
		describeRoute({
			summary: "Get ai prompt list",
			tags: ["AI Prompt"],
		}),
		async (c) => {
			const promptList = await db.aiPrompt.findMany({
				orderBy: {
					business: "asc"
				}
			});
			return c.json(promptList);
		}
	)
	.post(
		"/",
		describeRoute({
			summary: "Create ai prompt",
			tags: ["AI Prompt"],
		}),
		validator("json", z.object({
			business: z.string(),
			description: z.string().optional(),
			prompt: z.string(),
			model: z.string().optional(),
		})),
		async (c) => {
			try {
				const { business, description, prompt, model } = c.req.valid("json");
				await db.aiPrompt.create({
						data: {
								business,
								description: description || "", // 确保description总是一个字符串
								prompt,
								model: model || "gpt-4o-mini",
						}
				});

				return c.json({
					message: "AI prompt created successfully"
				});

			} catch (error) {
				logger.error("Error saving ai prompt:", error);
				return c.json(
					{
						error: "Failed to create ai prompt",	
						details: error instanceof Error ? error.message : "Unknown error"
					},
					500
				);
			}
		}
	)
	.put(
		"/:id",
		describeRoute({
			summary: "Update ai prompt",
			tags: ["AI Prompt"],
		}),
		validator("json", z.object({
			business: z.string().optional(),
			description: z.string().optional(),
			prompt: z.string().optional(),
			model: z.string(),
		})),
		async (c) => {
			try {
				const { business, description, prompt, model } = c.req.valid("json");
				const id = c.req.param("id");
				
					await db.aiPrompt.update({
								where: {
										id
								},
								data: {
										business,
										description: description || "", // 确保description总是一个字符串
										prompt,
										model: model || "gpt-4o-mini",
								}
						})

				return c.json({
					message: "AI prompt updated successfully"
				});


			} catch (error) {
				logger.error("Error updating ai prompt:", error);
				return c.json(
					{
						error: "Failed to update ai prompt",	
						details: error instanceof Error ? error.message : "Unknown error"
					},
					500
				);
			}
		}
	);