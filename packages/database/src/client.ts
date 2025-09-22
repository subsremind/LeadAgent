import { drizzle } from "drizzle-orm/node-postgres";
// import * as schema from "./schema/postgres";
 
const databaseUrl = process.env.DATABASE_URL as string;
 
if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set");
}
 
export const db = drizzle(databaseUrl);