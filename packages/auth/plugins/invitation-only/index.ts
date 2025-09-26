import { config } from "@repo/config";
import { db } from "@repo/database";
import { invitation } from "@repo/database/drizzle/schema";
import type { BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";
import { logger } from "@repo/logs";

export const invitationOnlyPlugin = () =>
	({
		id: "invitationOnlyPlugin",
		hooks: {
			before: [
				{
					matcher: (context) =>
						context.path.startsWith("/sign-up/email"),
					handler: createAuthMiddleware(async (ctx) => {
						if (config.auth.enableSignup) {
							return;
						}

						const { email } = ctx.body;

						// check if there is an invitation for the email
					const hasInvitation = await db.query.invitation.findFirst({
						where: (i, { eq, and }) => and(
							eq(i.email, email),
							eq(i.status, "pending")
						),
					});

						if (!hasInvitation) {
							throw new APIError("BAD_REQUEST", {
								code: "INVALID_INVITATION",
								message: "No invitation found for this email",
							});
						}
					}),
				},
			],
		},
		$ERROR_CODES: {
			INVALID_INVITATION: "No invitation found for this email",
		},
	}) satisfies BetterAuthPlugin;
