import { Hono } from "hono";
import { suggestionRouterRouter } from "./suggestion";
import { draftRouterRouter } from "./draft";
import { resourceFeedbackRouter } from "./resource_feedback";

export const leadAgentRouter = new Hono()
	.basePath("/leadagent")
	.route("/", suggestionRouterRouter)
	.route("/", draftRouterRouter)
	.route("/", resourceFeedbackRouter)
	;