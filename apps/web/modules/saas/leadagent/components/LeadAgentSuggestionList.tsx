"use client";

import { formatRelativeTime } from "@saas/utils/timezone";

import { Spinner } from "@shared/components/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
	ShieldQuestionIcon,
	Sparkles,
	ThumbsUp,
	ThumbsDown,
	
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

import { LeadAgentPagination } from "./LeadAgentPagination";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/tooltip";

export function LeadAgentSuggestionList({ platform }: { platform: string }) {
	const t = useTranslations();
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [embeddingRate, setEmbeddingRate] = useState<number>(0.7);
	const [displayEmbeddingRate, setDisplayEmbeddingRate] = useState<number>(0.7); // 用于显示的即时值
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const queryClient = useQueryClient();

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



	const { data, isLoading } = useQuery({
		queryKey: ["leadagent-setting", currentPage, pageSize, agentSetting?.query, agentSetting?.subreddit, embeddingRate],
		enabled: !!agentSetting?.query && !!agentSetting?.subreddit,
		queryFn: async () => {
		let url = "/api/leadagent/suggestion/search";
		//改为post请求
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				page: currentPage,
				pageSize: pageSize,
				subreddit: agentSetting?.subreddit,
				embeddingRate: embeddingRate,
			}),
		});
		return await response.json(); 
	},
	});


	// 从API响应中直接获取数据
	const { records, total } = data || {};
	const totalPages = Math.ceil(total / pageSize);
	const currentData = records || [];

	// 分页状态
	const canPreviousPage = currentPage > 1;
	const canNextPage = currentPage < totalPages;

	// 分页事件处理
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handlePageSizeChange = (size: number) => {
		setPageSize(size);
		setCurrentPage(1); // 重置到第一页
	};
    
    // 组件卸载时清除定时器
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

	// 处理反馈（点赞/点踩）
	const handleFeedback = async (resourceId: string, feedbackId?: string, feedbackType: number = 1) => {
		try {
			const response = await fetch('/api/leadagent/resource-feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: feedbackId,
					resourceId,
					resourceType: 'reddit_post_suggestion',
					feedbackType,
				}),
			});

			const data = await response.json();
			if (data.success) {
				// 刷新数据
				queryClient.invalidateQueries({ queryKey: ['leadagent-setting'] });
			}
		} catch (error) {
			console.error('Failed to submit feedback:', error);
		}
	};

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center space-x-2">
					<Label className="whitespace-nowrap">{t("leadAgent.suggestion.embeddingRate")}</Label>
					<TooltipProvider>
						
						<Tooltip>
						<TooltipTrigger asChild>
						<InfoIcon size={16} />
						</TooltipTrigger>
						<TooltipContent>
							<p>{t("leadAgent.suggestion.embeddingRateTooltip")}</p>
						</TooltipContent>
						</Tooltip>
						</TooltipProvider>
					<Slider
						className="w-32"
						defaultValue={[embeddingRate]} 
						max={1} 
						step={0.1} 
						onValueChange={(value) => {
							// 立即更新显示值
							setDisplayEmbeddingRate(value[0]);
							// 清除之前的定时器
							if (debounceRef.current) {
								clearTimeout(debounceRef.current);
							}
							// 设置新的定时器，300毫秒后更新实际值并触发查询
							debounceRef.current = setTimeout(() => {
								setEmbeddingRate(value[0]);
							}, 300);
						}} />
					<span className="text-sm text-muted-foreground min-w-[40px] text-left">{displayEmbeddingRate * 100}%</span>
					{/* <Label className="whitespace-nowrap text-sm text-muted-foreground">{total} Records</Label> */}

					
				</div>
				
			</div>

			{isAgentSettingLoading || isLoading ? (
				<div className="flex justify-center items-center h-64">
					<Spinner className="mr-2 size-4 text-primary" />
					{t("common.loading")}
				</div>
			) : currentData.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
					<InfoIcon className="size-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground mb-2">{t("common.table.empty")}</p>
				</div>
			) : (
				currentData.map((item: any) => (
					<Card key={item.id} className="mb-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]">
						
						<Link href={item.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
							<CardHeader>
								
								<div>
									<Label className="ml-auto text-xs text-muted-foreground justify-start">{item.author} · {formatRelativeTime(new Date(item.createdUtc))} </Label>
								</div>
								<CardTitle className="text-base font-bold text-muted-foreground">
											{item.title}
								</CardTitle>
								{item.aiSummary && (
									<div className="bg-yellow-50 rounded-lg m-[0_0_0_0] p-[5px_5px] shadow-sm relative">
										<span className="text-[15px] font-semibold text-sky-600 leading-tight">
											<Sparkles className="size-4 text-[#FFC107] inline-block mr-2 align-text-bottom" /> {item.aiSummary}
										</span>
									</div>
								)}
								
								<CardDescription className="mb-2 overflow-hidden text-ellipsis text-sm text-muted-foreground opacity-80" style={{display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', lineHeight: '1.5'}}>{item.selftext}</CardDescription>
							</CardHeader>
						</Link>
						<CardFooter>
							<div className="flex w-full flex-wrap gap-2">
								{/* 显示 reason 字段 */}
								{item.reason && (
									<Badge
										status="info" 
										className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
									>
										{item.reason}
									</Badge>
								)}

								<Badge
								status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums"
								>
									<ArrowBigUp size={16}/>
									{item.ups}
								</Badge>
								<Badge
								status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums"
								>
									<ArrowBigDown size={16}/>
									{item.downs}
								</Badge>

								<Badge
								status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums"
								>
									<MessageCircleMore size={16}/>
									{item.numComments}
								</Badge>

								<Badge
								status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums bg-slate-600 text-white normal-case"
								>
									{item.subreddit}
								</Badge>
								
								<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Badge
										status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums cursor-help"
										>
											<ShieldQuestionIcon size={16}/>
											{item.aiAnalyzeRecords[0]?.confidence * 100}%
										</Badge>
									</TooltipTrigger>
									<TooltipContent className="w-[280px] max-h-96 overflow-auto">
										<p className="whitespace-pre-wrap">{item.aiAnalyzeRecords[0]?.result?.reason || ''}</p>
									</TooltipContent>
								</Tooltip>
								</TooltipProvider>

								<Badge
								status="info" 
								className={`flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums cursor-pointer transition-colors hover:bg-primary/10 ${item.userFeedback?.thumbsUp ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800' : ''}`}
								onClick={() => handleFeedback(item.id, item.userFeedback?.id, 1)}
								>
									<ThumbsUp  size={16}/>
								</Badge>
								<Badge
								status="info" 
								className={`flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums cursor-pointer transition-colors hover:bg-primary/10 ${item.userFeedback?.thumbsDown ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800' : ''}`}	
								onClick={() => handleFeedback(item.id, item.userFeedback?.id, 2)}
								>
									<ThumbsDown  size={16}/>
								</Badge>
							</div>
						</CardFooter>
					</Card>
				))
			)}
			<LeadAgentPagination
				currentPage={currentPage}
				totalPages={totalPages}
				pageSize={pageSize}
				totalItems={total}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				canPreviousPage={canPreviousPage}
				canNextPage={canNextPage}
			/>
		</div>
	);
}
