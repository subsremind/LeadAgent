import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { getRedditPost } from "../lib/task-redditpost";
import { getNoAnalyzePost } from "../lib/ai-analyzepost";
import { logger } from "@repo/logs";

// 动态路由
export const scheduleRouter = new Hono().get(
	"/schedule/:task",
	describeRoute({
		tags: ["Schedule"],
		summary: "Schedule",
		description: "Run scheduled tasks",
		responses: { 200: { description: "OK" } },
	}),
	async (c) => {
		const task = c.req.param("task");
		logger.info(`=============start to run task: ${task}`);
		if (task === "sync-reddit-post") {
			await getRedditPost();
		} else if (task === "ai-analyze-post") {
			await getNoAnalyzePost();
		} else {
			return new Response("Task not found", { status: 404 });
		}
		logger.info(`=============finish to run task: ${task}`);
		return new Response("OK");
	},
);
