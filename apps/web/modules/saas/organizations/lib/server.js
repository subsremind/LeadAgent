import { db } from "@repo/database";
export const getOrganizationById = async (id) => {
    const organization = await db.organization.findUnique({
        where: {
            id,
        },
    });
    return organization;
};
