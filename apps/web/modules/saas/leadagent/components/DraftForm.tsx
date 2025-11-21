"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@saas/auth/hooks/use-session";
import { Button } from "@ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Bot } from "lucide-react";
import { Textarea } from "@ui/components/textarea";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { apiClient } from "@shared/lib/api-client";
import { useQuery } from "@tanstack/react-query";

interface AgentSetting {
  description?: string;
}

const formSchema = z.object({
		type: z.string().min(1, "Type must be selected"),
		description: z.string().min(1, "Custom prompt must be at least 1 character"),
});

type FormValues = z.infer<typeof formSchema>;

export function DraftForm({
	// agentSetting,
	onGenerateSuccess,
}: {
	// agentSetting?: AgentSetting;
	onGenerateSuccess: (open: boolean, isReload: boolean, draftList: any[]) => void;
}) {
	const t = useTranslations();

	const [isGenerating, setIsGenerating] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: "",
			description: "",
		},
	});

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
			return result; 
		},
	});

	const onSubmit = form.handleSubmit(async (data) => {
			try {
				setIsGenerating(true);
				// 确保query有值，即使不是必填的
				const response = await apiClient.leadagent.draft["generate"].$post({
					json: {
						customPrompt: data.description || "",
						type: data.type || "",
					},
				});
				if (!response.ok) {
					toast.error(t("leadAgent.form.generateFailed"));
					return;
				}
				const result = await response.json();
				// 确保传递正确格式的数组给onGenerateSuccess
				onGenerateSuccess(false, true, Array.isArray(result) ? result : []);
			} catch (error: any) {
				toast.error(error.message || t("leadAgent.form.generateFailed"));
			} finally {
				setIsGenerating(false);
			}
		});

	return (
		<Form {...form} >
			<form onSubmit={onSubmit}>
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.draft.type")}</FormLabel>
							<FormControl>
								<Select>
								<SelectTrigger className="w-[280px]">
									<SelectValue placeholder={t("leadAgent.draft.type")} />
								</SelectTrigger>
								<SelectContent>
									{draftTypeList?.map((item: any) => (
										<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
									))}
								</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.draft.customPrompt")}</FormLabel>
							<FormControl>
								<Textarea className="min-h-[450px]" {...field} placeholder={t("leadAgent.draft.customPromptPlaceholder")} />
							</FormControl>
							<FormMessage />
						</FormItem>
				)}
				/>

				<div className="col-span-2 w-full flex justify-end p-3">
					<Button
						variant="primary"
						type="submit"
						loading={isGenerating}
						className="flex items-center space-x-2"
					>
						<Bot />{t("leadAgent.draft.generate")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
