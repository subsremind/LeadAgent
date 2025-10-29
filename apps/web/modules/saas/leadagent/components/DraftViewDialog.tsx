"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { useTranslations } from "next-intl";

interface DraftViewDialogProps {
	title: string;
	channel: string,
	content: string;
}


export function DraftViewDialog({
	open,
	onSuccess,
	draft,	
}: {
	open: boolean;
	onSuccess: (open: boolean) => void;
	draft: DraftViewDialogProps,
}) {
	const t = useTranslations();
	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				onSuccess(isOpen);
			}}
		>
			<DialogContent
				className="w-[45rem] !max-w-[45vw] max-h-[80vh] overflow-hidden"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>
						{t("leadAgent.draft.form_title")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 p-4 bg-slate-50 rounded-lg">
					<div className="text-2xl font-bold text-slate-800">{draft.title}</div>
					<div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{draft.channel}</div>
					<div className="text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-auto pr-2">{draft.content}</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
