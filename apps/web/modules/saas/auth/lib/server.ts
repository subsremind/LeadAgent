import "server-only";
import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: {
			disableCookieCache: true,
		},
	});

	return session;
});

export const getActiveOrganization = cache(async (slug: string) => {
	try {
		const activeOrganization = await auth.api.getFullOrganization({
			query: {
				organizationSlug: slug,
			},
			headers: await headers(),
		});

		return activeOrganization;
	} catch (error) {
		return null;
	}
});

export const getOrganizationList = cache(async () => {
	try {
		const organizationList = await auth.api.listOrganizations({
			headers: await headers(),
		});

		return organizationList;
	} catch (error) {
		return [];
	}
});

export const getUserAccounts = cache(async () => {
	try {
		const userAccounts = await auth.api.listUserAccounts({
			headers: await headers(),
		});

		return userAccounts;
	} catch (error) {
		return [];
	}
});

export const getInvitation = cache(async (id: string) => {
	try {
		const invitationRecord = await db.query.invitation.findFirst({
			where: (invitation, { eq }) => eq(invitation.id, id),
			with: { org: true },
		});

		if (!invitationRecord) {
			return null;
		}

		const { org, ...rest } = invitationRecord as typeof invitationRecord & {
			org?: any;
		};

		return { ...rest, organization: org } as typeof invitationRecord & {
			organization: typeof org;
		};
	} catch (error) {
		return null;
	}
});
