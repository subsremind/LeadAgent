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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select"
import { Textarea } from "@ui/components/textarea";
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
	const [draftList, setDraftList] = useState<any[]>([]);
	const [currentDraft, setCurrentDraft] = useState<any>({});
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [selectedType, setSelectedType] = useState<string>("");
	const [customPrompt, setCustomPrompt] = useState<string>("");
	const queryClient = useQueryClient();

	const { data: draftTypeList, isLoading: isDraftTypeLoading } = useQuery({	
			queryKey: ["leadagent-draft-type"],
			queryFn: async () => {
				const response = await fetch("/api/admin/ai_prompt/draft");
				let result = await response.json();
				// draft-generate-use-cases 截取draft-generate-开头的, label 要首字母大写，类似className="capitalize"的效果
				result = result.map((item: any) => ({
					value: item.business,
					label: item.business.replace("draft-generate-", "").replace(/-/g, ' ').toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase()),
				}));
				console.log(result);
				return result; 
			},
		});

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

	// const {data: draftList = [], isLoading: isDraftListLoading} = useQuery({
		// queryKey: ["draft-list", platform], // 将platform添加到queryKey中，确保不同平台的数据缓存是独立的
		// queryFn: async () => {
			// const response = await fetch("/api/leadagent/draft/generate", {
			// 	method: "POST",
			// 	headers: {
			// 		"Content-Type": "application/json",
			// 	},
			// 	body: JSON.stringify({ platform }), // 传递platform参数
			// });
			// if (!response.ok) {
			// 	const result = await response.json();
			// 	toast.error(result.error || "Failed to fetch draft-list");
			// 	return [];
			// } else {
			// 	const result = await response.json();
			// 	return result || [];
			// }
			
		// },
	// });

	const handleGenerateClick = async () => {
		// 使用isGenerating状态来确保按钮在invalidateQueries期间显示loading效果
		setIsGenerating(true);
		try {
			// 获取select和textarea的值，调用API获取结果
			const response = await fetch("/api/leadagent/draft/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ 
					platform,
					type: selectedType,
					customPrompt: customPrompt,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				toast.error(errorData.error || t("leadAgent.form.generateFailed"));
				return;
			}

			const result = await response.json();
			if (result && Array.isArray(result)) {
				setDraftList(result);
				// 触发数据重新加载，包含platform参数
				await queryClient.invalidateQueries({ queryKey: ["draft-list", platform] });
			}
		} catch (error) {
			console.error("Error generating drafts:", error);
			toast.error(t("leadAgent.form.generateFailed"));
		} finally {
			// 无论成功失败，都在最后重置状态
			setIsGenerating(false);
		}
	}


	const onGenerateSuccess = (open: boolean, isReload: boolean, draftList: any[]) => {
		setGenerateOpen(open);
		if (isReload) {
			setDraftList(draftList);
		}
	};

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
			<div className="flex flex-col gap-4 mb-4">
				<Select value={selectedType} onValueChange={setSelectedType}>
								<SelectTrigger className="w-[280px]">
									<SelectValue placeholder={t("leadAgent.draft.type")} />
								</SelectTrigger>
								<SelectContent>
									{draftTypeList?.map((item: any) => (
										<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
									))}
								</SelectContent>
								</Select>
				<Textarea 
					value={customPrompt}
					onChange={(e) => setCustomPrompt(e.target.value)}
					placeholder={t("leadAgent.draft.customPromptPlaceholder")} 
				/>
				<Button
					variant="primary"
					className="bg-sky-600 border-0 hover:bg-sky-600 hover:opacity-90 w-fit"
					disabled={isGenerating}
					onClick={() => {
						handleGenerateClick();
					}}
				>
					{isGenerating ? (
						<Spinner className="mr-2 size-4" />
					) : (
						<BotMessageSquareIcon className="size-4" />
					)}
					{t("leadAgent.draft.generate")}
				</Button>
			</div>

			{/* {isDraftListLoading || isGenerating ? (
				<div className="flex justify-center items-center h-64">
					<Spinner className="mr-2 size-4 text-primary" />
					{t("common.loading")}
				</div>
			) : draftList.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
					<InfoIcon className="size-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground mb-2">{t("common.table.empty")}</p>
				</div>
			) : ( */}
			{isGenerating ? (
			<div className="flex justify-center items-center h-64">
				<Spinner className="mr-2 size-6 text-primary" />
				{t("common.loading")}
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
			{/* )} */}
			
			{/* { <DraftGenerateDialog
				open={generateOpen}
				// agentSetting={agentSetting}
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
