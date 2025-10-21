import { cors } from "hono/cors";
// 允许所有来源，这在开发环境中很方便
// 在生产环境中，你可能需要更严格的配置
export const corsMiddleware = cors({
    // 根据hono/cors的类型定义，origin回调函数需要两个参数，且返回类型为string | null | undefined
    origin: (origin) => {
        // 开发环境允许任何来源，返回null表示允许所有来源
        if (process.env.NODE_ENV !== "production") {
            return null;
        }
        // 生产环境返回原始origin
        return origin;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
});
