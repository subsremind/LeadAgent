import { BotIcon } from "lucide-react";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";

import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { ContainerIcon, SendIcon } from "lucide-react";

export default async function LeadAgentLayout({ children }: PropsWithChildren) {
  const t = await getTranslations();

  return (
    <>
      <PageHeader
        title={t("leadAgent.title")}
        subtitle={t("leadAgent.descriptionLabel")}
      />
      <SidebarContentLayout
        sidebar={
          <SettingsMenu
            menuItems={[
              {
                avatar: (
                  <BotIcon
                    className="size-8"
                    
                  />
                ),
                title: t("leadAgent.title"),
                items: [
                  {
                    title: t("leadAgent.menu.suggestion"),
                    href: "/app/leadagent/suggestion",
                    icon: (
                      <ContainerIcon  className="size-4 opacity-50" />
                    ),
                  },
                  {
                    title: t("leadAgent.menu.draft"),
                    href: "/app/leadagent/draft",
                    icon: (
                      <SendIcon className="size-4 opacity-50" />
                    ),
                  },
                ],
              },
            ]}
          />
        }
      >
        {children}
      </SidebarContentLayout>
    </>
  );
}
