"use client";

import { LeadAgentSuggestionList } from "./components/LeadAgentSuggestionList";

export function SuggestionPage({
	organizationId,
}: {
	organizationId?: string;
}) {
	return (
			<div className="w-full overflow-auto">
				<LeadAgentSuggestionList/>
			</div>
	);
}
