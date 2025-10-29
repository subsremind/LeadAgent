// "use client";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";

import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { ContainerIcon, SendIcon, BotIcon } from "lucide-react";

import { AgentSettingHeader } from "@saas/leadagent/components/AgentSettingHeader";

export default async function LeadAgentLayout({
  children,
  params,
}: PropsWithChildren & {
  params: Promise<{
    platform: string;
  }>;
}) {
  const t = await getTranslations();
  const resolvedParams = await params;
  const { platform } = resolvedParams;
  
  return (
    <>
      <AgentSettingHeader/>
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
                title: t("leadAgent.menu.title"),
                items: [
                  {
                    title: t("leadAgent.menu.suggestion"),
                    href: `/app/leadagent/${platform}/suggestion`,
                    icon: (
                      <ContainerIcon  className="size-4 opacity-50" />
                    ),
                  },
                  {
                    title: t("leadAgent.menu.draft"),
                    href: `/app/leadagent/${platform}/draft`,
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
        {/* 如果没有子组件（即直接访问 /app/leadagent/[platform]），则显示DraftPage */}
        {children }
      </SidebarContentLayout>
      {/* {<AgentSetupDialog
				open={false}
				agentSetting={null}
				onSuccess={() => {}}
			/>
			} */}
    </>
  );
}
