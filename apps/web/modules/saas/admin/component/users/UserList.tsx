"use client";

import { authClient } from "@repo/auth/client";
import { adminUsersQueryKey, useAdminUsersQuery } from "@saas/admin/lib/api";
import { useConfirmationAlert } from "@saas/shared/components/ConfirmationAlertProvider";
import { Pagination } from "@saas/shared/components/Pagination";
import { Spinner } from "@shared/components/Spinner";
import { UserAvatar } from "@shared/components/UserAvatar";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Input } from "@ui/components/input";
import { Slider } from "@ui/components/slider";
import { Table, TableHeader, TableBody, TableCell, TableRow } from "@ui/components/table";
import {
	MoreVerticalIcon,
	Repeat1Icon,
	ShieldCheckIcon,
	ShieldXIcon,
	SquareUserRoundIcon,
	TrashIcon,
	CreditCardIcon,
	RefreshCcwDot,
	ChartNetwork
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@ui/components/dialog";
import { useDebounceValue } from "usehooks-ts";
import { EmailVerified } from "../EmailVerified";

const ITEMS_PER_PAGE = 10;

export function UserList() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();
	const [currentPage, setCurrentPage] = useQueryState(
		"currentPage",
		parseAsInteger.withDefault(1),
	);
	const [searchTerm, setSearchTerm] = useQueryState(
		"query",
		parseAsString.withDefault(""),
	);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounceValue(
		searchTerm,
		300,
		{
			leading: true,
			trailing: false,
		},
	);
	const [showCreditModal, setShowCreditModal] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedUserName, setSelectedUserName] = useState("");
	const [creditTotal, setCreditTotal] = useState("");
	const [creditUsed, setCreditUsed] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setDebouncedSearchTerm(searchTerm);
	}, [searchTerm]);

	const { data, isLoading, refetch } = useAdminUsersQuery({
		itemsPerPage: ITEMS_PER_PAGE,
		currentPage,
		searchTerm: debouncedSearchTerm,
	});

	useEffect(() => {
		setCurrentPage(1);
	}, [debouncedSearchTerm]);

	const impersonateUser = async (
		userId: string,
		{ name }: { name: string },
	) => {
		const toastId = toast.loading(
			t("admin.users.impersonation.impersonating", {
				name,
			}),
		);

		await authClient.admin.impersonateUser({
			userId,
		});
		await refetch();
		toast.dismiss(toastId);
		window.location.href = new URL(
			"/app",
			window.location.origin,
		).toString();
	};

	const deleteUser = async (id: string) => {
		toast.promise(
			async () => {
				await authClient.admin.removeUser({
					userId: id,
				});
			},
			{
				loading: t("admin.users.deleteUser.deleting"),
				success: () => {
					return t("admin.users.deleteUser.deleted");
				},
				error: t("admin.users.deleteUser.notDeleted"),
			},
		);
	};

	const resendVerificationMail = async (email: string) => {
		toast.promise(
			async () => {
				await authClient.sendVerificationEmail({
					email,
				});
			},
			{
				loading: t("admin.users.resendVerificationMail.submitting"),
				success: () => {
					return t("admin.users.resendVerificationMail.success");
				},
				error: t("admin.users.resendVerificationMail.error"),
			},
		);
	};

	const assignAdminRole = async (id: string) => {
		await authClient.admin.setRole({
			userId: id,
			role: "admin",
		});

		await queryClient.invalidateQueries({
			queryKey: adminUsersQueryKey,
		});
	};

	const removeAdminRole = async (id: string) => {
		await authClient.admin.setRole({
			userId: id,
			role: "user",
		});

		await queryClient.invalidateQueries({
			queryKey: adminUsersQueryKey,
		});
	};

	const userCreditSetting = (id: string) => {
		const user = users.find(u => u.id === id);
		setSelectedUserId(id);
		setSelectedUserName(user?.name || '');
		setCreditTotal(user?.userCreditSetting?.credit?.toString() || "0");
		setCreditUsed(user?.userCreditUsage?.credit?.toString() || "0");
		setShowCreditModal(true);
	};

	const saveUserCredit = async () => {
		// 防止重复提交
		if (!selectedUserId || isSubmitting) return;

		try {
			// 设置提交状态为true
			setIsSubmitting(true);
			
			// 调用新的API端点保存用户积分设置
			const response = await fetch('/api/admin/user_credit_setting/save', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					credit: parseInt(creditTotal) || 0,
					userId: selectedUserId // 添加用户ID参数
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to save credit setting');
			}

			toast.success(t("common.status.success"));
			// 刷新用户列表
			await queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
		} catch (error) {
			toast.error(t("common.status.failure"));
		} finally {
			// 无论成功失败，都重置提交状态
			setIsSubmitting(false);
			setShowCreditModal(false);
		}
	};

	const handleSyncRedditPosts = async (userId: string) => {
		try {
			const response = await fetch('/api/admin/users/sync-reddit-posts', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('Failed to sync Reddit posts');
			}
			toast.success(t("common.status.success"));			
		} catch (error) {
			toast.error(t("common.status.failure"));
		}
		await refetch();
	};
	const startAnalysis = async (userId: string) => {
		try {
			const response = await fetch('/api/admin/users/start-analysis', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error('Failed to sync Reddit posts');
			}
			toast.success(t("common.status.success"));			
		} catch (error) {
			toast.error(t("common.status.failure"));
		}
		await refetch();
	};
	const columns: ColumnDef<
		NonNullable<
			Awaited<ReturnType<typeof authClient.admin.listUsers>>["data"]
		>["users"][number]
	>[] = useMemo(
		() => [
			{
				accessorKey: "user",
				header: "User",
				accessorFn: (row) => row.name,
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<UserAvatar
							name={row.original.name ?? row.original.email}
							avatarUrl={row.original.image}
						/>
						<div className="leading-tight">
							<strong className="block">
								{row.original.name ?? row.original.email}
							</strong>
							<small className="flex items-center gap-1 text-foreground/60">
								<span className="block">
									{!!row.original.name && row.original.email}
								</span>
								<EmailVerified
									verified={row.original.emailVerified}
								/>
								<strong className="block">
									{row.original.role === "admin"
										? "Admin"
										: ""}
								</strong>
							</small>
						</div>
					</div>
				),
			},
			{
				accessorKey: "user_credit",
				header: "Credit Usage",
				accessorFn: (row) => row.userCredit,
				cell: ({ row }) => (
					<div className="flex items-center ">
						{(() => {
							const used = row.original.userCreditUsage?.credit || 0;
							const total = row.original.userCreditSetting?.credit || 0;
							let colorClass = 'text-emerald-600'; 
							
							if (used > total) {
								colorClass = 'text-red-600'; 
							} else if (total > 0 && used / total >= 0.8) {
								colorClass = 'text-amber-600';
							}
							
							return (
								<span className={colorClass}>
									{used} / {total}
								</span>
							);
						})()}
					</div>
				),
			},
			{
				accessorKey: "actions",
				header: "",
				cell: ({ row }) => {
					return (
						<div className="flex flex-row justify-end gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost">
										<MoreVerticalIcon className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem
										onClick={() =>
											impersonateUser(row.original.id, {
												name: row.original.name ?? "",
											})
										}
									>
										<SquareUserRoundIcon className="mr-2 size-4" />
										{t("admin.users.impersonate")}
									</DropdownMenuItem>

									{!row.original.emailVerified && (
										<DropdownMenuItem
											onClick={() =>
												resendVerificationMail(
													row.original.email,
												)
											}
										>
											<Repeat1Icon className="mr-2 size-4" />
											{t(
												"admin.users.resendVerificationMail.title",
											)}
										</DropdownMenuItem>
									)}

									{row.original.role !== "admin" ? (
										<DropdownMenuItem
											onClick={() =>
												assignAdminRole(row.original.id)
											}
										>
											<ShieldCheckIcon className="mr-2 size-4" />
											{t("admin.users.assignAdminRole")}
										</DropdownMenuItem>
									) : (
										<DropdownMenuItem
											onClick={() =>
												removeAdminRole(row.original.id)
											}
										>
											<ShieldXIcon className="mr-2 size-4" />
											{t("admin.users.removeAdminRole")}
										</DropdownMenuItem>
									)}

									<DropdownMenuItem
									onClick={() =>
											userCreditSetting(row.original.id)
									}>
								<CreditCardIcon className="mr-2 size-4" />
									{t("admin.users.credit.creditSetting")}
								</DropdownMenuItem>
										<DropdownMenuItem
										onClick={() =>
											handleSyncRedditPosts(row.original.id)	
										}>
									<RefreshCcwDot className="mr-2 size-4" />
										{t("admin.users.action.syncPost")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
											startAnalysis(row.original.id)	
									}>
								<ChartNetwork className="mr-2 size-4" />
									{t("admin.users.action.startAnalysis")}
							</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											confirm({
												title: t(
													"admin.users.confirmDelete.title",
												),
												message: t(
													"admin.users.confirmDelete.message",
												),
												confirmLabel: t(
													"admin.users.confirmDelete.confirm",
												),
												destructive: true,
												onConfirm: () =>
													deleteUser(row.original.id),
											})
										}
									>
										<span className="flex items-center text-destructive hover:text-destructive">
											<TrashIcon className="mr-2 size-4" />
											{t("admin.users.delete")}
										</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							</div>
						);
					},
			},
		],
		[],
	);

	const users = useMemo(() => data?.users ?? [], [data?.users]);

	const table = useReactTable({
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
	});

	return (
		<Card className="p-6">
			<h2 className="mb-4 font-semibold text-2xl">
				{t("admin.users.title")}
			</h2>
			<Input
				type="search"
				placeholder={t("admin.users.search")}
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="mb-4"
			/>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableCell
										key={header.id}
										className="font-medium"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
											  )}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
									className="group"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="py-2 group-first:rounded-t-md group-last:rounded-b-md"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{isLoading ? (
										<div className="flex h-full items-center justify-center">
											<Spinner className="mr-2 size-4 text-primary" />
											{t("admin.users.loading")}
										</div>
									) : (
										<p>No results.</p>
									)}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

		{data?.total && data.total > ITEMS_PER_PAGE && (
			<Pagination
				className="mt-4"
				totalItems={data.total}
				itemsPerPage={ITEMS_PER_PAGE}
				currentPage={currentPage}
				onChangeCurrentPage={setCurrentPage}
			/>
		)}

		<Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("admin.users.credit.creditSetting")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium min-w-[100px]">{t("admin.users.credit.user")}</label>
						<p className="text-sm font-semibold flex-1">{selectedUserName || ''}</p>
					</div>
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium min-w-[100px]">{t("admin.users.credit.creditUsed")}</label>
						<p className="text-sm font-semibold flex-1">{creditUsed || 0}</p>
					</div>
					<div className="flex items-center space-x-4">
						<label className="text-sm font-medium min-w-[100px]">{t("admin.users.credit.creditTotal")}</label>
						<div className="flex-1 max-w-xs flex items-center space-x-4">
							<Slider
								min={0}
								max={2000}
								step={50}
								value={[Number(creditTotal) || 0]}
								onValueChange={(value) => setCreditTotal(value[0].toString())}
								className="flex-1"
							/>
							<span className="text-sm font-semibold whitespace-nowrap">{creditTotal}</span>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={() => setShowCreditModal(false)} variant="ghost">
						{t("common.confirmation.cancel")}
					</Button>
					<Button onClick={saveUserCredit} disabled={isSubmitting}>
						{isSubmitting ? t("common.confirmation.submitting") : t("common.confirmation.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</Card>
);
}
