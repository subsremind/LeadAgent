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
		
		// 异步执行任务，不等待完成
		if (task === "sync-reddit-post") {
			getRedditPost().catch(err => {
				logger.error(`Error executing sync-reddit-post task: ${err}`);
			});
		} else if (task === "ai-analyze-post") {
			getNoAnalyzePost().catch(err => {
				logger.error(`Error executing ai-analyze-post task: ${err}`);
			});
		} else {
			return new Response("Task not found", { status: 404 });
		}
		
		// 立即返回任务提交成功响应
		return new Response("Task submitted successfully");
	},
);
