import { getActiveOrganization } from "@saas/auth/lib/server";
import OrganizationStart from "@saas/organizations/components/OrganizationStart";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
export async function generateMetadata({ params, }) {
    const { organizationSlug } = await params;
    const activeOrganization = await getActiveOrganization(organizationSlug);
    return {
        title: activeOrganization?.name,
    };
}
export default async function OrganizationPage({ params, }) {
    const { organizationSlug } = await params;
    const t = await getTranslations();
    const activeOrganization = await getActiveOrganization(organizationSlug);
    if (!activeOrganization) {
        return notFound();
    }
    return (<div>
			<PageHeader title={activeOrganization.name} subtitle={t("organizations.start.subtitle")}/>

			<OrganizationStart />
		</div>);
}
