"use client";

import { Button } from "@ui/components/button";
import { SettingsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AgentSetupDialog } from "@saas/leadagent/components/AgentSetupDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function AgentSettingHeader() {
	const t = useTranslations();
    const queryClient = useQueryClient();
    const [editOpen, setEditOpen] = useState<boolean>(false);

    const { data: agentSetting, isLoading: isAgentSettingLoading } = useQuery({
		queryKey: ["agent-setting"],
		queryFn: async () => {
			const response = await fetch("/api/agent-setting/my");
			if (!response.ok) {
				throw new Error("Failed to fetch agent-setting");
			}
			return await response.json();
		},
	});

	const onEditSuccess = (open: boolean, isReload: boolean) => {
		setEditOpen(open);
		if (isReload) {
			reload();
		}
	};


	const reload = () => {
		queryClient.invalidateQueries({ queryKey: ["agent-setting"] });
	};


	return (
		<>
            <div className="mb-8 border-b pb-4 flex flex-col md:flex-row justify-between">
                <div>
                    <h2 className="font-bold text-2xl lg:text-3xl">{t("leadAgent.title")}</h2>
                    <p className="mt-1 opacity-60">{t("leadAgent.descriptionLabel")}</p>
                </div>
                <div className="mt-4 md:mt-auto self-start md:self-end">
                    <Button
                        variant="primary"
                        className="bg-sky-600 border-0 hover:bg-sky-600 hover:opacity-90"
                        onClick={() => {
                            setEditOpen(true);
                        }}
                    >
                        <SettingsIcon className="size-4" />
                        {t("leadAgent.agentSetting")}
                    </Button>
                </div>
            </div>
            {
                <AgentSetupDialog
                    open={editOpen}
                    agentSetting={agentSetting}
                    onSuccess={onEditSuccess}
                />
            }
            
        </>
	);
}