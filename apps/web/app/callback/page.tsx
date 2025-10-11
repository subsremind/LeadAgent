"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { logger } from "@repo/logs";
import { useRouter } from "@shared/hooks/router";
import { Button } from "@ui/components/button";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

export default function CallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const code = searchParams.get("code");
				const state = searchParams.get("state");
				const error = searchParams.get("error");

				// 检查是否有错误参数
				if (error) {
					setStatus("error");
					setMessage(`Authorization failed: ${error}`);
					toast.error(`Authorization failed: ${error}`);
					return;
				}

				// 检查是否有授权码
				if (!code) {
					setStatus("error");
					setMessage("No authorization code received");
					toast.error("No authorization code received");
					return;
				}

				// 设置授权码并触发token获取
				try {
					// 调用API端点来处理授权码并存储token
					const response = await fetch('/callback/reddit', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ code, state }),
					});

					if (!response.ok) {
						const errorText = await response.text();
						throw new Error(`API request failed: ${response.status} - ${errorText}`);
					}

					const result = await response.json();
					
					if (result.success) {
						setStatus("success");
						setMessage("Reddit authorization completed successfully!");
						toast.success("Reddit authorization completed successfully!");
					} else {
						throw new Error(result.error || 'Unknown error');
					}
				} catch (apiError) {
					logger.error("Failed to process Reddit authorization:", apiError);
					setStatus("error");
					setMessage(`Failed to process authorization: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
					toast.error("Failed to process authorization");
					return;
				}

				// 3秒后自动关闭窗口（如果是弹窗）
				setTimeout(() => {
					if (window.opener) {
						window.close();
					}
				}, 3000);
			} catch (error) {
				logger.error("Reddit authorization callback error:", error);
				setStatus("error");
				setMessage("An unexpected error occurred");
				toast.error("An unexpected error occurred");
			}
		};

		handleCallback();
	}, [searchParams]);

	const handleClose = () => {
		if (window.opener) {
			window.close();
		} else {
			router.push("/");
		}
	};

	const handleGoHome = () => {
		if (window.opener) {
			window.opener.location.href = "/";
			window.close();
		} else {
			router.push("/");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="max-w-md w-full mx-auto p-6">
				<div className="text-center space-y-6">
					{status === "loading" && (
						<>
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
							<h1 className="text-xl font-semibold">
								Processing Authorization...
							</h1>
							<p className="text-muted-foreground">
								Please wait while we complete your Reddit authorization.
							</p>
						</>
					)}

					{status === "success" && (
						<>
							<CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
							<h1 className="text-xl font-semibold text-green-600">
								Authorization Successful
							</h1>
							<p className="text-muted-foreground">{message}</p>
							<p className="text-sm text-muted-foreground">
								This window will close automatically in a few seconds.
							</p>
							<Button onClick={handleClose} className="mt-4">
								Close Window
							</Button>
						</>
					)}

					{status === "error" && (
						<>
							<XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
							<h1 className="text-xl font-semibold text-red-600">
								Authorization Failed
							</h1>
							<p className="text-muted-foreground">{message}</p>
							<div className="flex gap-2 justify-center mt-4">
								<Button variant="outline" onClick={handleClose}>
									Close Window
								</Button>
								<Button onClick={handleGoHome}>
									Go Home
								</Button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
