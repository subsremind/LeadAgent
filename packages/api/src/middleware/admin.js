import { auth } from "@repo/auth";
import { createMiddleware } from "hono/factory";
export const adminMiddleware = createMiddleware(async (c, next) => {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });
    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    if (session.user.role !== "admin") {
        return c.json({ error: "Forbidden" }, 403);
    }
    c.set("session", session.session);
    c.set("user", session.user);
    await next();
});
