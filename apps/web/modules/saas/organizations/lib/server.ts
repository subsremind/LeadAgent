import { db } from "@repo/database";

export const getOrganizationById = async (id: string) => {
	const organization = await db.query.organization.findFirst({
		where: (org, { eq }) => eq(org.id, id),
	});

	return organization;
};
