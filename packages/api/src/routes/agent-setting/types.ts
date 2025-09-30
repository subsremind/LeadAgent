import { any, z } from "zod";


export const AgentSettingModel = z.object({
  id: z.string(),
  userId: z.string(),
  description: z.string(),
  subreddit: z.string().optional(),
  query: z.string().optional(),
  embedding: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const AgentSettingCreateInput = z.object({
  userId: z.string(),
  description: z.string().nonempty(),
  subreddit: z.string().optional(),
  query: z.string().nonempty(),

});

export const AgentSettingUpdateInput = AgentSettingCreateInput.partial().extend({
  organizationId: z.string().nullable(),
  embedding: z.any().optional()
});

export type AgentSetting = z.infer<typeof AgentSettingModel>;
export type AgentSettingCreateInput = z.infer<typeof AgentSettingCreateInput>;
export type AgentSettingUpdateInput = z.infer<typeof AgentSettingUpdateInput>;


