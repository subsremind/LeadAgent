"use client";

import { formatCurrency } from "@saas/utils/currency";
import { formatDateWithTimezone } from "@saas/utils/timezone";
import { Spinner } from "@shared/components/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Card,
	CardContent,
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
	BadgeCheckIcon
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AgentSetupDialog } from "./AgentSetup";

export function LeadAgentList({
	categoryId,
	organizationId,
}: { categoryId?: string; organizationId?: string }) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [alertOpen, setAlertOpen] = useState<boolean>(false);
	const [editOpen, setEditOpen] = useState<boolean>(false);
	const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
	const [subscription, setSubscription] = useState<any | null>(null);

	const onEditSuccess = (open: boolean, isReload: boolean) => {
		setEditOpen(open);
		if (isReload) {
			reload();
		}
	};


	const reload = () => {
		queryClient.invalidateQueries({
			queryKey: ["subscription-categories"],
		});
		queryClient.invalidateQueries({
			queryKey: ["total-subscriptions"],
		});
		queryClient.invalidateQueries({ queryKey: ["subscription"] });
	};

	const { data, isLoading } = useQuery({
		queryKey: ["raddit-list", categoryId, organizationId],
		queryFn: async () => {
			let url = "/api/lead-agent";
			const params = new URLSearchParams();
			if (categoryId) {
				params.append("categoryId", categoryId);
			}
			if (organizationId) {
				params.append("organizationId", organizationId);
			}
			url += `?${params.toString()}`;
			const response = await fetch(url);
			return await response.json(); // Directly return the array from API
		},
	});

	

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold">{t("leadAgent.list.title")}</h2>
				<Button
					variant="ghost"
					onClick={() => {
						setEditOpen(true);
						setSubscription(null);
					}}
				>
					<PlusIcon className="size-4" />
					{t("common.actions.new")}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center h-64">
					<Spinner className="mr-2 size-4 text-primary" />
					{t("common.loading")}
				</div>
			) : (
				data.map((item) => (
					<Card key={item.id} className="mb-2">
						<CardHeader>
							<CardTitle>{item.title}</CardTitle>
							<CardDescription className="mb-2 overflow-hidden text-ellipsis whitespace-nowrap">{item.selftext}</CardDescription>
						</CardHeader>
						<CardContent>
							<p>Card Content</p>
						</CardContent>
						<CardFooter>
						<Badge
							variant="secondary"
							className="bg-blue-500 text-white dark:bg-blue-600"
							>
							<BadgeCheckIcon />
							Verified
							</Badge>
							<Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
							8
							</Badge>
							<Badge
							className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
							variant="destructive"
							>
							99
							</Badge>
						</CardFooter>
					</Card>
				))
			)}
			{<AgentSetupDialog
				open={editOpen}
				categoryId={categoryId}
				organizationId={organizationId}
				subscription={subscription}
				onSuccess={onEditSuccess}
			/>
			/* 
			<AlertSubscriptionDialog
				open={alertOpen}
				subscriptionId={subscription?.id}
				onOpen={onAlertOpenChange}
			/>
			<DeleteSubscriptionDialog
				open={deleteOpen}
				subscriptionId={subscription?.id}
				onSuccess={onDeleteSuccess}
			/> */}
		</div>
	);
}
