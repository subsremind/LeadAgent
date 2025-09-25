import { db } from "@repo/database";
import { organization, user } from "@repo/database/drizzle/schema";
import { eq } from "drizzle-orm";

export async function setCustomerIdToEntity(
	customerId: string,
	{ organizationId, userId }: { organizationId?: string; userId?: string },
) {
	if (organizationId) {
		await db
			.update(organization)
			.set({ paymentsCustomerId: customerId })
			.where(eq(organization.id, organizationId));
	} else if (userId) {
		await db
			.update(user)
			.set({ paymentsCustomerId: customerId })
			.where(eq(user.id, userId));
	}
}

export const getCustomerIdFromEntity = async (
	props: { organizationId: string } | { userId: string },
) => {
	if ("organizationId" in props) {
		return (
			(
				await db.query.organization.findFirst({
					where: (org, { eq }) => eq(org.id, props.organizationId),
				})
			)?.paymentsCustomerId ?? null
		);
	}

	return (
		(
			await db.query.user.findFirst({
				where: (u, { eq }) => eq(u.id, (props as { userId: string }).userId),
			})
		)?.paymentsCustomerId ?? null
	);
};
