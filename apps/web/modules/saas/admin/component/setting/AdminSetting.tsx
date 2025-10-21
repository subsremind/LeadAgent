"use client";
import { useTranslations } from "next-intl";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { Card } from "@ui/components/card";
import { RedditAuth } from "./RedditAuth";
import { useQuery } from "@tanstack/react-query";
import { CreditSetting } from "./CreditSetting";



export function AdminSetting() {
	const t = useTranslations();
	const { data, isLoading, error } = useQuery({
		queryKey: ["adminSetting"],
		queryFn: async () => {
		  const response = await fetch("/api/admin/setting", {
			method: "GET"
		  });
		  
		  if (!response.ok) {
			throw new Error("Failed to update setting");
		  }
		  
		  return await response.json();
		},
	  });

	return (
		<SettingsList>
			<SettingsItem
				title={t("admin.setting.reddit.title")}
				description={t("admin.setting.reddit.description")}
			>
				<Card className="p-6">
					<RedditAuth />
				</Card>
			</SettingsItem>
			<SettingsItem
				title={t("admin.setting.credit_title")}
				description={t("admin.setting.credit_description")}
			>
				<CreditSetting value={data?.token_credit_mapping || ""} />
			</SettingsItem>
		</SettingsList>
	);
}
