import { openai } from "@ai-sdk/openai";
import { aiServiceManager } from "./lib/ai-service-manager";

export const textModel = openai("gpt-4o-mini");
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");
export const embeddingModel = openai("text-embedding-ada-002");

// 导出AI服务管理器实例
export { aiServiceManager };

export * from "ai";
export * from "./lib";
