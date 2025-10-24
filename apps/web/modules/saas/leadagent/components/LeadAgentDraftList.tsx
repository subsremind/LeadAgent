"use client";


import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@ui/components/card"
import { Badge } from "@ui/components/badge"
import {
	ArrowBigDown,
	ArrowBigUp,
	MessageCircleMore,
	SettingsIcon,
	InfoIcon,
	CheckCheckIcon,
	BotMessageSquareIcon,
	
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

import { AgentSetupDialog } from "./AgentSetup";
import { LeadAgentPagination } from "./LeadAgentPagination";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/tooltip";
import { DraftGenerateDialog } from "@saas/leadagent/components/DraftGenerateDialog";
import { DraftViewDialog } from "@saas/leadagent/components/DraftViewDialog";
import { apiClient } from "@shared/lib/api-client";
import { toast } from "sonner";

export function LeadAgentDraftList() {
	const t = useTranslations();
	const [generateOpen, setGenerateOpen] = useState<boolean>(false);
	const [viewOpen, setViewOpen] = useState<boolean>(false);
	const [draftList, setDraftList] = useState<any[]>([]);
	const [currentDraft, setCurrentDraft] = useState<any>({});
	const [isGenerating, setIsGenerating] = useState<boolean>(false);

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

	const onGenerateSuccess = (open: boolean, isReload: boolean, draftList: any[]) => {
		setGenerateOpen(open);
		if (isReload) {
			console.log('onGenerateSuccess 2 ', draftList);
			setDraftList(draftList);
		}
	};

	const handleGenerateClick = async () => {
		setIsGenerating(true);
		const response = await apiClient.leadagent.draft["generate"].$post({
			json: {
				customPrompt: agentSetting.description || "",
			},
		});
		if (!response.ok) {
			toast.error(t("leadAgent.form.generateFailed"));
			setIsGenerating(false);
			return;
		}
		const result = await response.json();
		if (result?.length > 0) {
			setDraftList(result);
		}
	}


	

	
	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-4">
				<Button
					variant="primary"
					className="bg-sky-600 border-0 hover:bg-sky-600 hover:opacity-90"
					disabled={isAgentSettingLoading}
					onClick={() => {
						// setGenerateOpen(true);
						handleGenerateClick();
					}}
				>
					<BotMessageSquareIcon className="size-4" />
					{t("leadAgent.draft.generate")}
				</Button>
			</div>

			{draftList.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
					<InfoIcon className="size-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground mb-2">{t("leadAgent.list.noDataPrompt")}</p>
				</div>
			) : (
				draftList.map((item: any, item_index: number) => (
					// <Link key={item_index} rel="noopener noreferrer">
						<Card key={item_index} className="mb-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer"
							onClick={() => {
								setViewOpen(true);
								setCurrentDraft(item);
							}}
						>
							<CardHeader>
								{/* <div>
									<Label className="ml-auto text-xs text-muted-foreground justify-start">{item.author} · {formatRelativeTime(new Date(item.createdUtc))} </Label>
								</div> */}
								<CardTitle>
									{item.title}
								</CardTitle>
								<CardDescription className="mb-2 overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', lineHeight: '1.5'}}>{item.content}</CardDescription>
							</CardHeader>
							<CardFooter>
								<div className="flex w-full flex-wrap gap-2">
									<Badge
									status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums bg-slate-600 text-white normal-case"
									>
										{item.channel}
									</Badge>
								</div>
							</CardFooter>
						</Card>
					// </Link>
				))
			)}
			{<DraftGenerateDialog
				open={generateOpen}
				agentSetting={agentSetting}
				onGenerateSuccess={onGenerateSuccess}
			/>
			}
			{<DraftViewDialog
				open={viewOpen}
				draft={currentDraft}
				onSuccess={(isOpen) => {
					setViewOpen(isOpen);
				}}
			/>
			}
		</div>
	);
}
