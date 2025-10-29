"use client";

import { LeadAgentDraftList } from "./components/LeadAgentDraftList";

export function DraftPage({
  platform,
}: {
  platform?: string;
}) {
	return (
			<div className="w-full overflow-auto">
				<LeadAgentDraftList platform={platform || "linkedin"} />
			</div>
	);
}
