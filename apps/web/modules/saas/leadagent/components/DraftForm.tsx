"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@saas/auth/hooks/use-session";
import { Button } from "@ui/components/button";
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

interface AgentSetting {
  description?: string;
}

const formSchema = z.object({
	description: z.string().min(1, "Custom prompt must be at least 1 character"),
});

type FormValues = z.infer<typeof formSchema>;

export function DraftForm({
	agentSetting,
	onGenerateSuccess,
}: {
	agentSetting?: AgentSetting;
	onGenerateSuccess: (open: boolean, isReload: boolean, draftList: any[]) => void;
}) {
	const t = useTranslations();

	const [isGenerating, setIsGenerating] = useState(false);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			description: agentSetting?.description || "",
		},
	});

	const onSubmit = form.handleSubmit(async (data) => {
			try {
				setIsGenerating(true);
				// 确保query有值，即使不是必填的
				const response = await apiClient.leadagent.draft["generate"].$post({
					json: {
						customPrompt: data.description || "",
					},
				});
				if (!response.ok) {
					toast.error(t("leadAgent.form.generateFailed"));
					return;
				}
				const result = await response.json();
				// 生成成功后，将数据传给leadAgentDraftList
				onGenerateSuccess(false, true, result || []);
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
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.draft.customPrompt")}</FormLabel>
							<FormControl>
								<Textarea className="min-h-[450px]" {...field} />
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
