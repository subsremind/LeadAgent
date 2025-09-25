import { cors } from "hono/cors";

// 允许所有来源，这在开发环境中很方便
// 在生产环境中，你可能需要更严格的配置
export const corsMiddleware = cors({
	origin: (origin) => {
		// 开发环境允许任何来源
		if (process.env.NODE_ENV !== "production") {
			return true;
		}
		// 生产环境可以添加更严格的检查
		return origin;
	},
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["POST", "GET", "OPTIONS"],
	exposeHeaders: ["Content-Length"],
	maxAge: 600,
	credentials: true,
});
