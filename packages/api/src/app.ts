import { auth } from "@repo/auth";
import { getBaseUrl } from "@repo/utils";
import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import {} from "openapi-merge";
import {} from "openapi-merge";
import { mergeOpenApiSchemas } from "./lib/openapi-schema";
import { corsMiddleware } from "./middleware/cors";
import { loggerMiddleware } from "./middleware/logger";
import { adminRouter } from "./routes/admin/router";
import { aiRouter } from "./routes/ai";
import { authRouter } from "./routes/auth";
import { contactRouter } from "./routes/contact/router";
import { healthRouter } from "./routes/health";
import { newsletterRouter } from "./routes/newsletter";
import { organizationsRouter } from "./routes/organizations/router";
import { paymentsRouter } from "./routes/payments/router";
import { leadAgentCategoryRouter } from "./routes/leadAgent-category/router";
import { leadAgentRouter } from "./routes/leadagent/router";
import { agentSettingRouter } from "./routes/agent-setting/router";
import { uploadsRouter } from "./routes/uploads";
import { webhooksRouter } from "./routes/webhooks";
import { scheduler } from "@repo/scheduler";
import { getRedditPost } from "./lib/get-post";
import { config } from "@repo/config";
export const app = new Hono().basePath("/api");

app.use(loggerMiddleware);
app.use(corsMiddleware);

const appRouter = app
	.route("/", authRouter)
	.route("/", webhooksRouter)
	.route("/", aiRouter)
	.route("/", uploadsRouter)
	.route("/", paymentsRouter)
	.route("/", contactRouter)
	.route("/", newsletterRouter)
	.route("/", organizationsRouter)
	.route("/", adminRouter)
	.route("/", healthRouter)
	.route("/", leadAgentRouter)
	.route("/", leadAgentCategoryRouter)
	.route("/", agentSettingRouter);

app.get(
	"/app-openapi",
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "LeadAgent API",
				version: "1.0.0",
			},
			servers: [
				{
					url: getBaseUrl(),
					description: "API server",
				},
			],
		},
	}),
);

app.get("/openapi", async (c) => {
	const authSchema = await auth.api.generateOpenAPISchema();
	const appSchema = await (
		app.request("/api/app-openapi") as Promise<Response>
	).then((res) => res.json());

	const mergedSchema = mergeOpenApiSchemas({
		appSchema,
		authSchema: authSchema as any,
	});

	return c.json(mergedSchema);
});

app.get(
	"/docs",
	apiReference({
		theme: "saturn",
		spec: {
			url: "/api/openapi",
		},
	}),
);

scheduler.schedule({
	id: "alert-task",
	cronExpression: "0 0 1/1 * * *",
	task: async () => {
		// sendSubscriptionAlerts();
	},
});

scheduler.schedule({
	id: "get-reddit-post",
	cronExpression: "*/15 * * * * *", //,config.syncPost.cronExpression,
	task: async () => {
		getRedditPost();
	},
});

export type AppRouter = typeof appRouter;
