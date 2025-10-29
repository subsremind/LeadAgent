"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@saas/auth/hooks/use-session";
import { tzdate, dateStrToTZDate, dateToUTC, dateFormat } from "@repo/utils"
import { Button } from "@ui/components/button";
import { Calendar } from "@ui/components/calendar";
import { Checkbox } from "@ui/components/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Bot } from "lucide-react";
import { Input } from "@ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";

const formSchema = z.object({
	description: z.string().optional(),
	query: z.string().min(1, "Query must be at least 1"),
	subreddit: z.string().optional(),
	organizationId: z.string().nullable().default(null).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AgentSetupForm({
	agentSetting,
	onSuccess,
}: {
	agentSetting?: any;
	onSuccess: (open: boolean, isReload: boolean) => void;
}) {
	const t = useTranslations();
	const { user } = useSession();

	const [isGenerating, setIsGenerating] = useState(false);
	

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: agentSetting
			? {
					...agentSetting
				}
			: {
					description: "",
					subreddit: "",
					query: "",
				},
	});

	async function handleGeneratePrompt() {
		try {
			const response = await fetch("/api/agent-setting/generate-prompt", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					description: form.getValues("description"),
				}),
			});
			if (!response.ok) {
				throw new Error(await response.text());
			}
			const data = await response.json();
			form.setValue("query", data.query);
			form.setValue("subreddit", data.subreddit);
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message || t("leadAgent.form.generateFailed"));
			} else {
				toast.error(t("leadAgent.form.generateFailed"));	
			}
		}
	}

	const onSubmit = form.handleSubmit(async (data) => {
		try {
			const url = agentSetting?.id
				? `/api/agent-setting/${agentSetting.id}`
				: "/api/agent-setting";
			const method = agentSetting?.id ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...data,
					userId: user?.id || null,
					id: agentSetting?.id || null,
				}),
			});

			if (!response.ok) {
				throw new Error(
					agentSetting
						? "Failed to update agent-setting"
						: "Failed to create agent-setting",
				);
			}

			toast.success(t("common.status.success"));
			onSuccess(false, true);
		} catch (e) {
			toast.error(t("common.status.error"));
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} >
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.form.description")}</FormLabel>
							<FormControl>
								<Textarea className="min-h-[150px]" {...field} />
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
						onClick={() => {
							setIsGenerating(true);
							handleGeneratePrompt().finally(() => {
								setIsGenerating(false);
							});
							form.setValue("query", "");
							form.setValue("subreddit", "");
						}}
					>
						<Bot />{t("leadAgent.form.generate")}
					</Button>
				</div>

				<FormField
					control={form.control}
					name="subreddit"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.form.subreddit")}</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="query"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.form.query")}</FormLabel>
							<FormControl>
								<Textarea className="min-h-[300px]" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{Object.entries(form.formState.errors).length > 0 && (
					<div className="bg-red-100 p-4 rounded-md mb-4">
						<p className="text-red-800">Please fix the errors below:</p>
						{Object.entries(form.formState.errors).map(([name, error]) => (
						<div key={name} className="mt-2">
							<p className="text-sm text-red-600">
							{name}: {error.message}
							</p>
						</div>
						))}
					</div>
					)}


				<div className="col-span-2 w-full flex justify-end p-3">
					<Button
						variant="primary"
						type="submit"
						loading={form.formState.isSubmitting}
						className="flex items-center space-x-2"
					>
						{t("common.confirmation.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
