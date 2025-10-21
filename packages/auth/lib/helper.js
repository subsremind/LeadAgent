export function isOrganizationAdmin(organization, user) {
    const userOrganizationRole = organization?.members.find((member) => member.userId === user?.id)?.role;
    return (["owner", "admin"].includes(userOrganizationRole ?? "") ||
        user?.role === "admin");
}
