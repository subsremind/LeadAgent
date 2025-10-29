"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import {
	EditIcon,
	PlusIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/api-client";
import { Label } from "@ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/components/table";

export function PromptList() {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPrompt, setEditingPrompt] = useState<any>(null);
	
	// 表单状态
	const [formData, setFormData] = useState({
		business: "",
		description: "",
		prompt: ""
	});

	// 获取prompt列表
	const { data: promptList = [], isLoading, error } = useQuery({
		queryKey: ["promptList"],
		queryFn: async () => {
			try {
				// 尝试使用apiClient
				const res = await apiClient.admin.aiPrompt.$get("/aiPrompt");
				if (!res.ok) throw new Error("Failed to fetch prompts");
				return await res.json();
			} catch (error) {
				throw new Error("Failed to fetch prompts");
			}
		},
	});

	// 保存prompt的mutation
	const savePromptMutation = useMutation({
		mutationFn: async (promptData: any) => {
			try {
				const url = editingPrompt ? `/api/admin/aiPrompt/${editingPrompt.id}` : "/api/admin/aiPrompt";
				const method = editingPrompt ? "PUT" : "POST";
				
				const response = await fetch(url, {
					method,
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(promptData),
				});
				
				if (!response.ok) throw new Error("Failed to save prompt");
				return await response.json();
			} catch (error) {
				console.error("Error saving prompt:", error);
				throw error;
			}
		},
		onSuccess: () => {
			toast.success(t("common.status.success"));
			// 重置表单和关闭对话框
			setFormData({ business: "", description: "", prompt: "" });
			setEditingPrompt(null);
			setDialogOpen(false);
			// 刷新列表
			queryClient.invalidateQueries({ queryKey: ["promptList"] });
		},
		onError: () => {
			toast.error(t("common.status.failure"));
		},
	});


	// 处理表单输入变化
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};



	// 打开新增对话框
	const handleAddPrompt = () => {
		setEditingPrompt(null);
		setFormData({ business: "", description: "", prompt: "" });
		setDialogOpen(true);
	};

	// 打开编辑对话框
	const handleEditPrompt = (prompt: any) => {
		setEditingPrompt(prompt);
		setFormData({
			business: prompt.business || "",
			description: prompt.description || "",
			prompt: prompt.prompt || ""
		});
		setDialogOpen(true);
	};


	// 提交表单
	const handleSubmit = () => {
		savePromptMutation.mutate(formData);
	};

	if (isLoading) {
		return <div className="flex justify-center items-center h-64">{t("common.loading")}</div>;
	}

	if (error) {
		return <div className="text-red-500">{t("common.status.failure")}</div>;
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold">{t("admin.menu.prompt")}</h2>
				<Button
					variant="primary"
					onClick={handleAddPrompt}
				>
					<PlusIcon className="mr-2 h-4 w-4" />
					{t("common.actions.new")}
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[200px]">Business</TableHead>
						<TableHead>Description</TableHead>
						<TableHead className="max-w-xs">Prompt Preview</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{promptList.map((item: any) => (
						<TableRow key={item.id} className="hover:bg-slate-50">
							<TableCell className="font-medium">{item.business || "-"}</TableCell>
							<TableCell>{item.description || "-"}</TableCell>
							<TableCell className="max-w-xs truncate">
								<div className="text-sm text-slate-600 line-clamp-2" title={item.prompt}>
									{item.prompt || t("common.table.empty")}
								</div>
							</TableCell>
							<TableCell className="flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleEditPrompt(item)}
									className="h-8 w-8 p-0 rounded-full"
								>
									<EditIcon className="h-4 w-4" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{promptList.length === 0 && (
				<div className="text-center py-12 text-slate-500">
					{t("common.table.empty")}
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="w-full max-w-3xl min-h-[90vh] max-h-[90vh] flex flex-col" onInteractOutside={(e) => e.preventDefault()} >
					<DialogHeader>
						<DialogTitle>
							{editingPrompt ? t("common.actions.edit") : t("common.actions.new")} {t("admin.menu.prompt")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="business">Business</Label>
							<Input
								id="business"
								name="business"
								value={formData.business}
								onChange={handleInputChange}
								placeholder="Enter business name"
								required
							/>
						</div>
						
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								placeholder="Enter description"
								className="min-h-[80px]"
								required
							/>
						</div>
						
						<div className="space-y-2">
							<Label htmlFor="prompt">Prompt Content</Label>
							<Textarea
								id="prompt"
								name="prompt"
								value={formData.prompt}
								onChange={handleInputChange}
								placeholder="Enter prompt content"
								className="min-h-[430px]"
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setDialogOpen(false)}
							disabled={savePromptMutation.isPending}
						>
							{t("common.confirmation.cancel")}
						</Button>
						<Button
							variant="primary"
							onClick={handleSubmit}
							disabled={savePromptMutation.isPending || !formData.business || !formData.description || !formData.prompt}
						>
							{t(savePromptMutation.isPending ? "common.confirmation.submitting" : "common.confirmation.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
);
}
