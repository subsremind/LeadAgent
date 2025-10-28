// "use client";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";

import { getTranslations } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { ContainerIcon, SendIcon, SettingsIcon, BotIcon } from "lucide-react";
import { Button } from "@ui/components/button";
// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";

import { AgentSetupDialog } from "@saas/leadagent/components/AgentSetupDialog";
import { AgentSettingHeader } from "@saas/leadagent/components/AgentSettingHeader";
// import { apiClient } from "@shared/lib/api-client";

export default async function LeadAgentLayout({ children }: PropsWithChildren) {
  const t = await getTranslations();
  // const [editOpen, setEditOpen] = useState<boolean>(false);

  // const { data: agentSetting, isLoading: isAgentSettingLoading } = useQuery({
	// 	queryKey: ["agent-setting"],
	// 	queryFn: async() => {

	// 		const response = await apiClient["agent-setting"]["my"].$get();
	// 		if (!response.ok) {
	// 			throw new Error("Failed to fetch agent-setting");
	// 		}
	// 		return await response.json();
	// 	},
	// });

  // const onEditSuccess = (open: boolean, isReload: boolean) => {
	// 	setEditOpen(open);
	// 	if (isReload) {
	// 		// reload();
	// 	}
	// };

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
      {/* {<AgentSetupDialog
				open={false}
				agentSetting={null}
				onSuccess={() => {}}
			/>
			} */}
    </>
  );
}
