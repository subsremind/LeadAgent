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

const formSchema = z.object({
	description: z.string().optional(),
	prompt: z.number().min(1, "Prompt must be at least 1"),
	path: z.string().optional(),
	organizationId: z.string().nullable().default(null).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AgentSetupForm({
	subscription,
	categoryId,
	organizationId,
	onSuccess,
}: {
	subscription?: any;
	categoryId?: string;
	organizationId?: string;
	onSuccess: (open: boolean, isReload: boolean) => void;
}) {
	const t = useTranslations();

	const { user } = useSession();

	// const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
	// 	queryKey: ["subscription-categories-select", organizationId],
	// 	queryFn: async () => {
	// 		const url = organizationId
	// 			? `/api/subscription-categories/select?organizationId=${organizationId}`
	// 			: "/api/subscription-categories/select";
	// 		const response = await fetch(url);
	// 		if (!response.ok) {
	// 			throw new Error("Failed to fetch categories");
	// 		}
	// 		return await response.json();
	// 	},
	// });

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: subscription
			? {
					...subscription,
					value: subscription.value ? Number(subscription.value) : 0,
					frequency: subscription.frequency
						? Number(subscription.frequency)
						: 1,
					nextPaymentDate: subscription.nextPaymentDate
						? new Date(subscription.nextPaymentDate).toISOString()
						: undefined,
					contractExpiry: subscription.contractExpiry
						? new Date(subscription.contractExpiry).toISOString()
						: undefined,
				}
			: {
					company: "",
					description: "",
					frequency: 1,
					value: 0,
					currency: "USD",
					cycle: "Monthly",
					type: "Subscription",
					recurring: true,
					nextPaymentDate: undefined,
					contractExpiry: undefined,
					urlLink: "",
					paymentMethod: "",
					categoryId: categoryId,
					notes: "",
					notesIncluded: false,
					tags: [],
				},
	});

	const onSubmit = form.handleSubmit(async (data) => {
		try {
			// if (data.categoryId === "none" || data.categoryId === "") {
			// 	data.categoryId = null;
			// }
			// if (data.paymentMethod === "none" || data.paymentMethod === "") {
			// 	data.paymentMethod = null;
			// }
			const url = subscription
				? `/api/subscription/${subscription.id}`
				: "/api/subscription";
			const method = subscription ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...data,
					organizationId,
				}),
			});

			if (!response.ok) {
				throw new Error(
					subscription
						? "Failed to update subscription"
						: "Failed to create subscription",
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
						loading={form.formState.isSubmitting}
						className="flex items-center space-x-2"
					>
						{t("leadAgent.form.generate")}
					</Button>
				</div>

				<FormField
					control={form.control}
					name="path"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.form.path")}</FormLabel>
							<FormControl>
								<Textarea {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="prompt"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("leadAgent.form.prompt")}</FormLabel>
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
						{t("common.confirmation.confirm")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
