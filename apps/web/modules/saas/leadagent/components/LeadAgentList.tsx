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
	BellPlus,
	EditIcon,
	MoreVerticalIcon,
	PlusIcon,
	Trash2Icon,
	BadgeCheckIcon,
	ArrowBigDown,
	ArrowBigUp,
	MessageCircleMore,
	Rss,
	SettingsIcon,
	InfoIcon
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

import { AgentSetupDialog } from "./AgentSetup";
import { LeadAgentPagination } from "./LeadAgentPagination";
import { Label } from "@ui/components/label";
import { Slider } from "@ui/components/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/tooltip";

export function LeadAgentList({
	categoryId,
	organizationId,
}: { categoryId?: string; organizationId?: string }) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [editOpen, setEditOpen] = useState<boolean>(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [embeddingRate, setEmbeddingRate] = useState<number>(0.7);
	const [displayEmbeddingRate, setDisplayEmbeddingRate] = useState<number>(0.7); // 用于显示的即时值
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

	const { data, isLoading } = useQuery({
		queryKey: ["lead-agent", currentPage, pageSize, agentSetting?.query, agentSetting?.subreddit, embeddingRate],
		enabled: !!agentSetting?.query && !!agentSetting?.subreddit,
		queryFn: async () => {
		let url = "/api/lead-agent/search";
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
	
	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center space-x-2">
					<Label className="whitespace-nowrap">{t("leadAgent.list.embeddingRate")}</Label>
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
					<span className="text-sm text-muted-foreground min-w-[40px] text-left">{displayEmbeddingRate.toFixed(1)}</span>
					<Label className="whitespace-nowrap text-sm text-muted-foreground">{total} Redords</Label>
				</div>
				
				<Button
					variant="primary"
					className="bg-sky-600 border-0"
					onClick={() => {
						setEditOpen(true);
					}}
				>
					<SettingsIcon className="size-4" />
					{t("leadAgent.list.agentSetting")}
				</Button>
			</div>

			{isAgentSettingLoading || isLoading ? (
				<div className="flex justify-center items-center h-64">
					<Spinner className="mr-2 size-4 text-primary" />
					{t("common.loading")}
				</div>
			) : currentData.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
					<InfoIcon className="size-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground mb-2">{t("leadAgent.list.noDataPrompt")}</p>
				</div>
			) : (
				currentData.map((item: any) => (
					<Link key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
						<Card className="mb-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer">
							<CardHeader>
								<div>
									<Label className="ml-auto text-xs text-muted-foreground justify-start">{item.author} · {formatRelativeTime(new Date(item.createdUtc))}</Label>
								</div>
								<CardTitle>
									{item.title}
								</CardTitle>
								<CardDescription className="mb-2 overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', lineHeight: '1.5'}}>{item.selftext}</CardDescription>
							</CardHeader>
							<CardFooter>
								<div className="flex w-full flex-wrap gap-2">
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
								</div>
							</CardFooter>
						</Card>
					</Link>
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
			{<AgentSetupDialog
				open={editOpen}
				categoryId={categoryId}
				organizationId={organizationId}
				agentSetting={agentSetting}
				onSuccess={onEditSuccess}
			/>
			}
		</div>
	);
}
