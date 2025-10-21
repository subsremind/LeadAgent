import { db } from "@repo/database";
export async function setCustomerIdToEntity(customerId, { organizationId, userId }) {
    if (organizationId) {
        await db.organization.update({
            where: { id: organizationId },
            data: { paymentsCustomerId: customerId },
        });
    }
    else if (userId) {
        await db.user.update({
            where: { id: userId },
            data: { paymentsCustomerId: customerId },
        });
    }
}
export const getCustomerIdFromEntity = async (props) => {
    if ("organizationId" in props) {
        return ((await db.organization.findUnique({
            where: { id: props.organizationId },
        }))?.paymentsCustomerId ?? null);
    }
    return ((await db.user.findUnique({
        where: { id: props.userId },
    }))?.paymentsCustomerId ?? null);
};
