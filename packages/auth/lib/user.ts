import { db } from "@repo/database";
import { user } from "@repo/database/drizzle/schema";
import { eq } from "drizzle-orm";

export async function getUserByEmail(email: string) {
	const userRecord = await db.query.user.findFirst({
		where: (u) => eq(u.email, email),
	});

	return userRecord;
}
