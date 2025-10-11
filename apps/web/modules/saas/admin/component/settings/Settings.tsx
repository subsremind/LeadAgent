"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { useTranslations } from "next-intl";


export function Settings() {
	const t = useTranslations();
	const { data: settings, isLoading: isSettingsLoading } = useQuery({
		queryKey: ["admin-settings"],
		queryFn: async () => {
			const response = await fetch("/api/admin/settings");
			if (!response.ok) {
				throw new Error("Failed to fetch settings");
			}
			return await response.json();
		},
	});

	

	return (
		<Card className="p-6">
			<h2 className="mb-6 font-semibold text-2xl">
				Settings
			</h2>

			{/* 顶部数字卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				
			</div>

			{/* Token消耗折线图 */}
		
		</Card>
	);
}
