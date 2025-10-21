import { openai } from "@ai-sdk/openai";
export const textModel = openai("gpt-4o-mini");
export const imageModel = openai("dall-e-3");
export const audioModel = openai("whisper-1");
export const embeddingModel = openai("text-embedding-ada-002");
export * from "ai";
export * from "./lib";
