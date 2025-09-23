import { LeadAgentPage } from "@saas/leadagent/page";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations();
  
  return (
    <>
      <PageHeader
        title={t("leadAgent.title")}
        subtitle={t("leadAgent.descriptionLabel")}
      />
      <div className="container mx-auto py-6">
        <LeadAgentPage />
      </div>
    </>
  );
}
