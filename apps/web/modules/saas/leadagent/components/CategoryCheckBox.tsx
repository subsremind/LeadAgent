"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@ui/components/card"
import { Input } from "@ui/components/input";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import { MoreVerticalIcon } from "lucide-react";
import { EditIcon, Trash2Icon } from "lucide-react";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface SubscriptionSidebarProps {
	onCategorySelect: (id: string | null) => void;
}

export function CategoryCheckBox({
	onCategorySelect,
	organizationId,
}: SubscriptionSidebarProps & { organizationId?: string }) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const {
		data: subscriptionCategories = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["leadAgent-categories", organizationId],
		queryFn: async () => {
			const url = "/api/leadAgent-categories";
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (!Array.isArray(data)) {
				throw new Error("Invalid data format received");
			}

			return data;
		},
	});

	

	const categoriesWithAll = [
		...(subscriptionCategories || []),
	];
	const [isAddingCategory, setIsAddingCategory] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(
		null,
	);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-4">
				<span>{t("leadAgent.categories.loading")}</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 text-red-500">
				<p>{t("leadAgent.categories.error", { message: error.message })}</p>
				<button
					onClick={() => window.location.reload()}
					type="button"
					className="mt-2 text-sm underline"
				>
					{t("leadAgent.categories.tryAgain")}
				</button>
			</div>
		);
	}

	const handleAddCategory = async () => {
		if (!newCategoryName.trim()) {
			toast.error(t("leadAgent.categories.empty"));
			return;
		}

		const isDuplicate = subscriptionCategories.some(
			(cat) =>
				cat.name.toLowerCase() === newCategoryName.trim().toLowerCase(),
		);

		if (isDuplicate) {
			toast.error(t("leadAgent.categories.duplicate"));
			return;
		}

		try {
			setIsAddingCategory(true);
			const response = await fetch("/api/leadAgent-categories", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: newCategoryName, organizationId }),
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			setNewCategoryName("");
			toast.success(t("leadAgent.categories.addSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["leadAgent-categories"],
			});
			setIsDialogOpen(false);
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message || t("leadAgent.categories.addFailed"));
			} else {
				toast.error(t("leadAgent.categories.addFailed"));	
			}
		} finally {
			setIsAddingCategory(false);
		}
	};

	const handleEditCategory = async () => {
		if (!editingCategory?.name.trim()) {
			toast.error(t("leadAgent.categories.empty"));
			return;
		}

		try {
			const response = await fetch(
				`/api/leadAgent-categories/${editingCategory.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: editingCategory.name,
						organizationId,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(await response.text());
			}

			toast.success(t("leadAgent.categories.updateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["leadAgent-categories"],
			});
			setEditingCategory(null);
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message || t("leadAgent.categories.updateFailed"));
			} else {
				toast.error(t("leadAgent.categories.updateFailed"));	
			}
		}
	};

	const handleDeleteCategory = async () => {
		if (!deleteCategoryId) return;

		try {
			const response = await fetch(
				`/api/leadAgent-categories/${deleteCategoryId}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				throw new Error(await response.text());
			}

			toast.success(t("leadAgent.categories.deleteSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["leadAgent-categories"],
			});
			setDeleteCategoryId(null);
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message || t("leadAgent.categories.deleteFailed"));
			} else {
				toast.error(t("leadAgent.categories.deleteFailed"));	
			}
		}
	};

	return (
		<div className="@container">
			<Card>
				<CardHeader>
					<CardDescription>Project</CardDescription>
				</CardHeader>
				<CardContent>
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-3">
						<Checkbox id="reddit" />
						<Label htmlFor="reddit">Reddit</Label>
					</div>
					
				</div>
				</CardContent>
			</Card>
			<Dialog
				open={!!editingCategory}
				onOpenChange={(open) => !open && setEditingCategory(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("leadAgent.categories.edit")}</DialogTitle>		
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<Input
							value={editingCategory?.name || ""}
							onChange={(e) =>
								setEditingCategory((prev) =>
									prev
										? { ...prev, name: e.target.value }
										: null,
								)
							}
						/>
						<div className="flex gap-2 justify-end">
							<Button onClick={() => setEditingCategory(null)}>
								{t("common.actions.cancel")}
							</Button>
							<Button
								variant="primary"
								onClick={handleEditCategory}
							>
								{t("leadAgent.categories.confirm")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteCategoryId}
				onOpenChange={(open) => !open && setDeleteCategoryId(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("leadAgent.categories.confirmDelete")}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<p>{t("leadAgent.categories.deleteConfirmMessage")}</p>
						<div className="flex gap-2 justify-end">
							<Button onClick={() => setDeleteCategoryId(null)}>
								{t("common.actions.cancel")}
							</Button>
							<Button
								variant="primary"
								onClick={handleDeleteCategory}
							>
								{t("leadAgent.categories.confirmDelete")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* <div className="grid gap-2"> */}
				
					
			{/* </div> */}
		</div>
	);
}
