"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { useTranslations } from "next-intl";
import { DraftForm } from "./DraftForm";

export function DraftGenerateDialog({
	open,
	agentSetting,
	onGenerateSuccess,
}: {
	open: boolean;
	agentSetting?: any;
	onGenerateSuccess: (open: boolean, isReload: boolean, draftList: any[]) => void;
}) {
	const t = useTranslations();
	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				onGenerateSuccess(isOpen, false, []);
			}}
		>
			<DialogContent
				className="w-[45rem] !max-w-[45vw]"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>
						{t("leadAgent.draft.form_title")}
					</DialogTitle>
				</DialogHeader>
				<DraftForm
					agentSetting={agentSetting}
					onGenerateSuccess={onGenerateSuccess}
				/>
			</DialogContent>
		</Dialog>
	);
}
