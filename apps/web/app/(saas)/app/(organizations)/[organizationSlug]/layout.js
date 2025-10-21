import { config } from "@repo/config";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { activeOrganizationQueryKey } from "@saas/organizations/lib/api";
import { purchasesQueryKey } from "@saas/payments/lib/api";
import { getPurchases } from "@saas/payments/lib/server";
import { AppWrapper } from "@saas/shared/components/AppWrapper";
import { getQueryClient } from "@shared/lib/server";
import { notFound } from "next/navigation";
export default async function OrganizationLayout({ children, params, }) {
    const { organizationSlug } = await params;
    const organization = await getActiveOrganization(organizationSlug);
    if (!organization) {
        return notFound();
    }
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery({
        queryKey: activeOrganizationQueryKey(organizationSlug),
        queryFn: () => organization,
    });
    if (config.users.enableBilling) {
        await queryClient.prefetchQuery({
            queryKey: purchasesQueryKey(organization.id),
            queryFn: () => getPurchases(organization.id),
        });
    }
    return <AppWrapper>{children}</AppWrapper>;
}
