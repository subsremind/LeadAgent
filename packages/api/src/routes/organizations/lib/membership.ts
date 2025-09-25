import { HTTPException } from "hono/http-exception";
import { db } from "@repo/database";
import { member } from "@repo/database/drizzle/schema";

export async function verifyOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	const membership = await db.query.member.findFirst({
		// where: {
		// 	userId_organizationId: {
		// 		userId,
		// 		organizationId,
		// 	},
		// },
		// include: {
		// 	organization: true,
		// },
	});

	if (!membership) {
		throw new HTTPException(404, {
			message: "User is not a member of this organization",
		});
	}

	return {
		// organization: membership.organization,
		role: membership.role,
	};
}
