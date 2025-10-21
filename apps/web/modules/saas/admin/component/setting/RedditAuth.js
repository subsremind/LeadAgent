"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEffect } from "react";
import { Spinner } from "@shared/components/Spinner";
import { getRedditAuthUrl } from "@repo/api/src/lib/task-redditpost";
import { Button } from "@ui/components/button";
const REDDIT_ICON = (<svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
		<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .968-.786 1.754-1.754 1.754a1.754 1.754 0 0 1-1.754-1.754l-.043-.089c-.676.24-1.386.427-2.126.558-.235 1.178-.481 2.358-.681 3.536-.398 2.343-1.182 4.653-2.32 6.773-.679 1.267-1.51 2.438-2.49 3.467a12.001 12.001 0 0 1-8.31-11.19c.025-.307.055-.613.088-.918a12.001 12.001 0 0 1 2.639-6.962z"/>
	</svg>);
export function RedditAuth() {
    const t = useTranslations();
    const queryClient = useQueryClient();
    // 查询授权状态
    const { data: authStatus, isLoading: isStatusLoading, error: statusError, refetch: refetchStatus } = useQuery({
        queryKey: ["admin-config-status"],
        queryFn: async () => {
            const response = await fetch("/api/admin/integration/reddit/status");
            if (!response.ok) {
                throw new Error("Failed to fetch integration status");
            }
            return await response.json();
        },
        retry: 2,
        refetchOnWindowFocus: false
    });
    // 断开连接 mutation
    const disconnectMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/admin/integration/reddit/delete", {
                method: "DELETE"
            });
            if (!response.ok) {
                throw new Error("Failed to disconnect Reddit authorization");
            }
            return await response.json();
        },
        onSuccess: () => {
            toast.success(t("admin.setting.reddit.notifications.disconnectSuccess"));
            queryClient.invalidateQueries({ queryKey: ["admin-integration-reddit-status"] });
        },
        onError: (error) => {
            toast.error(`${t("admin.setting.reddit.notifications.disconnectFailed")}: ${error instanceof Error ? error.message : t("common.status.error")}`);
        }
    });
    const isAuthorized = authStatus?.isAuthorized || false;
    const isLoading = isStatusLoading || disconnectMutation.isPending;
    // 处理授权状态错误
    useEffect(() => {
        if (statusError) {
            toast.error(`${t("admin.setting.reddit.notifications.getStatusFailed")}: ${statusError.message}`);
        }
    }, [statusError, t]);
    const handleAuthorize = async () => {
        try {
            const authUrl = await getRedditAuthUrl();
            if (!authUrl) {
                toast.error(t("admin.setting.reddit.notifications.getAuthUrlFailed"));
                return;
            }
            const popup = window.open(authUrl, "reddit-auth", "width=600,height=700,scrollbars=yes,resizable=yes");
            if (popup) {
                toast.info(t("admin.setting.reddit.notifications.authWindowOpened"));
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        setTimeout(() => {
                            refetchStatus();
                        }, 1000);
                    }
                }, 1000);
            }
            else {
                toast.error(t("admin.setting.reddit.notifications.popupBlocked"));
            }
        }
        catch (error) {
            toast.error(`${t("admin.setting.reddit.notifications.getAuthUrlFailed")}: ${error instanceof Error ? error.message : t("common.status.error")}`);
        }
    };
    const getStatusText = () => {
        if (isStatusLoading)
            return t("admin.setting.reddit.status.checking");
        return isAuthorized ? t("admin.setting.reddit.status.connected") : t("admin.setting.reddit.status.disconnected");
    };
    const getActionButton = () => {
        if (isAuthorized) {
            return (<Button variant="primary" className="shrink-0" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>
					{disconnectMutation.isPending ? (<>
							<Spinner className="mr-2 h-4 w-4"/>
							{t("admin.setting.reddit.actions.disconnecting")}
						</>) : (t("admin.setting.reddit.actions.disconnect"))}
				</Button>);
        }
        return (<Button variant="secondary" className="shrink-0" onClick={handleAuthorize} disabled={isLoading}>
				{isLoading ? (<>
						<Spinner className="mr-2 h-4 w-4"/>
						{t("admin.setting.reddit.actions.gettingAuthUrl")}
					</>) : (t("admin.setting.reddit.actions.authorize"))}
			</Button>);
    };
    return (<div className="grid grid-cols-1 gap-2">
			<div className="flex justify-between gap-4">
				<div className="flex gap-2">
					<div className="rounded-full h-6 w-6 bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
						{REDDIT_ICON}
					</div>
					<div>
						<strong className="block text-sm">
							{t("admin.setting.reddit.title")}
						</strong>
						<small className="block text-foreground/60 text-xs leading-tight">
							{getStatusText()}
						</small>
					</div>
				</div>
				{getActionButton()}
			</div>
		</div>);
}
