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

import { AgentSetupDialog } from "./AgentSetupDialog";
import { LeadAgentPagination } from "./LeadAgentPagination";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/tooltip";
import { DraftGenerateDialog } from "@saas/leadagent/components/DraftGenerateDialog";
import { DraftViewDialog } from "@saas/leadagent/components/DraftViewDialog";
import { apiClient } from "@shared/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@shared/components/Spinner";

export function LeadAgentDraftList({
  platform = "linkedin",
}: {
  platform: string;
}) {
	const t = useTranslations();
	const [generateOpen, setGenerateOpen] = useState<boolean>(false);
	const [viewOpen, setViewOpen] = useState<boolean>(false);
	// const [draftList, setDraftList] = useState<any[]>([]);
	const [currentDraft, setCurrentDraft] = useState<any>({});
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const queryClient = useQueryClient();

	// const { data: agentSetting, isLoading: isAgentSettingLoading } = useQuery({
	// 	queryKey: ["agent-setting"],
	// 	queryFn: async () => {
	// 		const response = await fetch("/api/agent-setting/my");
	// 		if (!response.ok) {
	// 			throw new Error("Failed to fetch agent-setting");
	// 		}
	// 		return await response.json();
	// 	},
	// });

	const {data: draftList = [], isLoading: isDraftListLoading} = useQuery({
		queryKey: ["draft-list", platform], // 将platform添加到queryKey中，确保不同平台的数据缓存是独立的
		queryFn: async () => {
			// const response = await apiClient.leadagent.draft["generate"].$post({
			// 	json: {
			// 		customPrompt: agentSetting.description || "",
			// 	},
			// });
			// const response = await fetch("/api/leadagent/draft/generate");
			const response = await fetch("/api/leadagent/draft/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ platform }), // 传递platform参数
			});
			if (!response.ok) {
				const result = await response.json();
				toast.error(result.error || "Failed to fetch draft-list");
				return [];
			} else {
				const result = await response.json();
				return result || [];
			}
			
		},
	});

		const handleGenerateClick = async () => {
		// 使用isGenerating状态来确保按钮在invalidateQueries期间显示loading效果
		setIsGenerating(true);
		try {
			// 触发数据重新加载，包含platform参数
			await queryClient.invalidateQueries({ queryKey: ["draft-list", platform] });
			// 等待数据加载完成
			// await queryClient.refetchQueries({ queryKey: ["draft-list"] });
		} finally {
			// 无论成功失败，都在最后重置状态
			setIsGenerating(false);
		}
	}


	// 	const onGenerateSuccess = (open: boolean, isReload: boolean, draftList: any[]) => {
	// 	setGenerateOpen(open);
	// 	if (isReload) {
	// 		setDraftList(draftList);
	// 	}
	// };

	// const handleGenerateClick = async () => {
	// 	setIsGenerating(true);
	// 	const response = await apiClient.leadagent.draft["generate"].$post({
	// 		json: {
	// 			customPrompt: agentSetting.description || "",
	// 		},
	// 	});
	// 	if (!response.ok) {
	// 		toast.error(t("leadAgent.form.generateFailed"));
	// 		setIsGenerating(false);
	// 		return;
	// 	}
	// 	const result = await response.json();
	// 	if (result?.length > 0) {
	// 		setDraftList(result);
	// 	}
	// }
	

	
	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-4">
				<Button
					variant="primary"
					className="bg-sky-600 border-0 hover:bg-sky-600 hover:opacity-90"
					disabled={isDraftListLoading || isGenerating}
					onClick={() => {
						// setGenerateOpen(true);
						handleGenerateClick();
					}}
				>
					{isDraftListLoading || isGenerating ? (
						<Spinner className="mr-2 size-4" />
					) : (
						<BotMessageSquareIcon className="size-4" />
					)}
					{t("leadAgent.draft.generate")}
				</Button>
			</div>

			{isDraftListLoading || isGenerating ? (
				<div className="flex justify-center items-center h-64">
					<Spinner className="mr-2 size-4 text-primary" />
					{t("common.loading")}
				</div>
			) : draftList.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
					<InfoIcon className="size-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground mb-2">{t("common.table.empty")}</p>
				</div>
			) : (
				// 确保draftList是数组且不为空，避免map调用错误
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
			{/* {<DraftGenerateDialog
				open={generateOpen}
				agentSetting={agentSetting}
				onGenerateSuccess={onGenerateSuccess}
			/>
			} */}
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
