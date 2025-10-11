"use client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEffect } from "react";
import { Spinner } from "@shared/components/Spinner";

export function Config() {
	const t = useTranslations();
	const { data: config, isAuthorized: isConfigAuthorized } = useQuery({
		queryKey: ["admin-config"],
		queryFn: async () => {
			const response = await fetch("/api/admin/config/status");
			if (!response.ok) {
				throw new Error("Failed to fetch config");
			}
			return await response.json();
		},
	});
	const disconnectMutation = null;//useRedditDisconnectMutation();

	const isAuthorized = false //authStatus?.isAuthorized || false;
	const isLoading = false //isStatusLoading || isUrlLoading || disconnectMutation.isPending;

	// // 处理授权状态错误
	// useEffect(() => {
	// 	if (statusError) {
	// 		toast.error(`获取授权状态失败: ${statusError.message}`);
	// 	}
	// }, [statusError]);
	const isStatusLoading =false
	const handleAuthorize = async () => {
	// 	try {
	// 		// 获取授权 URL
	// 		const result = await fetchAuthUrl();
	// 		const authUrl = result.data?.authUrl;
			
	// 		if (!authUrl) {
	// 			toast.error("无法获取授权链接");
	// 			return;
	// 		}

	// 		// 在新窗口中打开授权页面
	// 		const popup = window.open(
	// 			authUrl,
	// 			"reddit-auth",
	// 			"width=600,height=700,scrollbars=yes,resizable=yes"
	// 		);

	// 		if (popup) {
	// 			toast.info("授权窗口已打开，请完成授权流程");
				
	// 			// 监听弹窗关闭事件
	// 			const checkClosed = setInterval(() => {
	// 				if (popup.closed) {
	// 					clearInterval(checkClosed);
	// 					// 弹窗关闭后检查授权状态
	// 					setTimeout(() => {
	// 						refetchStatus();
	// 					}, 1000);
	// 				}
	// 			}, 1000);
	// 		} else {
	// 			toast.error("弹窗被阻止，请允许弹窗后重试");
	// 		}
	// 	} catch (error) {
	// 		toast.error(`获取授权链接失败: ${error instanceof Error ? error.message : '未知错误'}`);
	// 	}
	};

	const handleDisconnect = () => {
		//disconnectMutation.mutate();
	};
	

	

	return (
		<Card className="p-6">
			<div className="grid grid-cols-1 gap-2">
				<div className="flex justify-between gap-4">
					<div className="flex gap-2">
						<div className="rounded-full h-6 w-6 bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
							<svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754a1.754 1.754 0 0 1-1.754-1.754l-.043-.089c-.676.24-1.386.427-2.126.558-.235 1.178-.481 2.358-.681 3.536-.398 2.343-1.182 4.653-2.32 6.773-.679 1.267-1.51 2.438-2.49 3.467a12.001 12.001 0 0 1-8.31-11.19c.025-.307.055-.613.088-.918a12.001 12.001 0 0 1 2.639-6.962z"/>
							</svg>
						</div>
						<div>
							<strong className="block text-sm">
								Reddit
							</strong>
							<small className="block text-foreground/60 text-xs leading-tight">
								{isStatusLoading 
									? "检查授权状态中..."
									: isAuthorized 
										? "已连接"
										: "未连接"
								}
							</small>
						</div>
					</div>
					{(
						<Button
							variant="secondary"
							className="shrink-0"
							onClick={handleAuthorize}
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									{isStatusLoading ? "检查状态中..." : "获取授权链接中..."}
								</>
							) : (
								"授权连接"
							)}
						</Button>
					)}
				</div>
			</div>
		
		</Card>
	);
}
