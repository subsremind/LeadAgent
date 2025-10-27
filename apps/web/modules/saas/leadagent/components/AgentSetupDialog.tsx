"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { useTranslations } from "next-intl";
import { AgentSetupForm } from "./AgentSetupForm";

export function AgentSetupDialog({
	open,
	agentSetting,
	onSuccess,
}: {
	open: boolean;
	agentSetting?: any;
	onSuccess: (open: boolean, isReload: boolean) => void;
}) {
	const t = useTranslations();
	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				onSuccess(isOpen, false);
			}}
		>
			<DialogContent
				className="w-[45rem] !max-w-[45vw]"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>
						{t("leadAgent.form.setup")}
					</DialogTitle>
				</DialogHeader>
				<AgentSetupForm
					agentSetting={agentSetting}
					onSuccess={onSuccess}
				/>
			</DialogContent>
		</Dialog>
	);
}
