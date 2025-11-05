import { Hono } from "hono";
import { z } from "zod";
import { validator } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { db } from "@repo/database";
import { authMiddleware } from "../../middleware/auth";
import { logger } from "@repo/logs";


// 反馈请求的数据结构
const feedbackSchema = z.object({
  id: z.string().optional(),
  resourceId: z.string().min(1),
  resourceType: z.string().min(1),
  feedbackType: z.number().int().min(1).max(2), // 1: 点赞, 2: 点踩
  content: z.string().optional(),
});

export const resourceFeedbackRouter = new Hono()
  .basePath("/resource-feedback")
  .use(authMiddleware)
  .post(
    "/",
    validator("json", feedbackSchema),
    describeRoute({
      summary: "Create or update resource feedback",
      tags: ["Resource Feedback"],
    }),
    async (c) => {
      try {
        const userId = c.get("user").id;
        const { resourceId, resourceType, feedbackType, content } = c.req.valid("json");
        
        const feedback = await db.resourceFeedback.findFirst({
          where: {
              userId: userId,
              resourceId: resourceId,
              resourceType: resourceType,
          },
        });
        let isNew = false;
        if (feedback) {
          if (feedback.feedbackType !== feedbackType) {
            isNew = true;
          }
          await db.resourceFeedback.delete({
            where: {
              id: feedback.id,
            }
          });
        } else {
          isNew = true;
        }

        if (isNew) {
          await db.resourceFeedback.create({
            data: {
              userId,
              resourceId,
              resourceType,
              feedbackType,
              content,
            },
          });
          return c.json({ success: true, action: "created" });
        }
        return c.json({ success: true, action: "canceled" });  
      } catch (error) {
        logger.error("Error handling resource feedback:", error);
        return c.json({ success: false, error: "Failed to process feedback" }, 500);
      }
    },
  );