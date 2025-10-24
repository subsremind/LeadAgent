import { LeadAgentPage } from "@saas/leadagent/Suggestion";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export default async function Page({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const t = await getTranslations();
  const { organizationSlug } = await params;
  const organization = await getActiveOrganization(organizationSlug);

  if (!organization) {
    redirect("/app");
  }

  const organizationId = organization.id;

  return <>
      <PageHeader
        title={t("leadAgent.title")}
        subtitle={t("leadAgent.descriptionLabel")}
      />
      <div className="container mx-auto py-6">
        <LeadAgentPage organizationId={organizationId}/>
      </div>
    </>;
}
