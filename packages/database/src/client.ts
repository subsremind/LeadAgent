import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}
const queryClient = postgres(process.env.DATABASE_URL, {
	ssl: { rejectUnauthorized: false },
	max: 5,
	idle_timeout: 20,
	connect_timeout: 60,
	
  });
 
// 在开发环境启用SQL日志记录

export const db = drizzle(queryClient, {
  schema,
  logger: false,
});
