import { z } from "zod";
export const AgentSettingQuery = z.object({
    subreddit: z.string().optional(),
    embedding: z.string().optional(),
});
