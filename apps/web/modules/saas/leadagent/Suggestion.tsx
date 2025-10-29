"use client";

import { LeadAgentSuggestionList } from "./components/LeadAgentSuggestionList";

export function SuggestionPage({
	platform,
}: {
	platform: string;
}) {
	return (
			<div className="w-full overflow-auto">
				<LeadAgentSuggestionList platform={platform} />
			</div>
	);
}
