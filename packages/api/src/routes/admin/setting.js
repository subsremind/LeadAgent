import { db } from "@repo/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { adminMiddleware } from "../../middleware/admin";
import { logger } from "@repo/logs";
export const settingRouter = new Hono()
    .basePath("/setting")
    .use(adminMiddleware)
    .get("/", describeRoute({
    summary: "Get admin setting",
    tags: ["Setting"],
}), async (c) => {
    const adminSettings = await db.adminSetting.findMany();
    // 从 key, value 的结构整理成 { key: value } 的对象
    const settings = adminSettings.reduce((acc, cur) => {
        acc[cur.key] = cur.value;
        return acc;
    }, {});
    return c.json(settings);
})
    .post("/save", describeRoute({
    summary: "Save admin setting",
    tags: ["Setting"],
}), validator("json", z.object({
    key: z.string(),
    value: z.string()
})), async (c) => {
    try {
        const user = c.get("user");
        const { key, value } = c.req.valid("json");
        const dbRecord = await db.adminSetting.findUnique({
            where: {
                key
            }
        });
        if (!dbRecord) {
            await db.adminSetting.create({
                data: {
                    key,
                    value,
                    updatedBy: user.id
                }
            });
        }
        else {
            await db.adminSetting.update({
                where: {
                    key
                },
                data: {
                    value,
                    updatedBy: user.id
                }
            });
        }
        return c.json({
            message: "Admin setting saved successfully"
        });
    }
    catch (error) {
        logger.error("Error saving admin setting:", error);
        return c.json({
            error: "Failed to save admin setting",
            details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
});
