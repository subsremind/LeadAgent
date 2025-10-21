import { auth } from "@repo/auth";
import { getBaseUrl } from "@repo/utils";
import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
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
import { scheduleRouter } from "./routes/schedule";
import { integrationRouter } from "./routes/admin/integration";
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
    .route("/", scheduleRouter)
    .route("/", leadAgentCategoryRouter)
    .route("/", agentSettingRouter)
    .route("/", integrationRouter);
app.get("/app-openapi", openAPISpecs(app, {
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
}));
app.get("/openapi", async (c) => {
    const authSchema = await auth.api.generateOpenAPISchema();
    const appSchema = await app.request("/api/app-openapi").then((res) => res.json());
    const mergedSchema = mergeOpenApiSchemas({
        appSchema,
        authSchema: authSchema,
    });
    return c.json(mergedSchema);
});
app.get("/docs", apiReference({
    theme: "saturn",
    spec: {
        url: "/api/openapi",
    },
}));
//initializeTasks();
