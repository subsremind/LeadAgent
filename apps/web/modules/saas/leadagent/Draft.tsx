"use client";

import { LeadAgentDraftList } from "./components/LeadAgentDraftList";

export function DraftPage() {
	return (
			<div className="w-full overflow-auto">
				<LeadAgentDraftList
				/>
			</div>
	);
}
