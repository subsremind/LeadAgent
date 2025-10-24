import { Hono } from "hono";
import { suggestionRouterRouter } from "./suggestion";
import { draftRouterRouter } from "./draft";

export const leadAgentRouter = new Hono()
	.basePath("/leadagent")
	.route("/", suggestionRouterRouter)
	.route("/", draftRouterRouter)
	;