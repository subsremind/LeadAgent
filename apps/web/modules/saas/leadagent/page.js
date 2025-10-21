"use client";
import { useState } from "react";
import { LeadAgentList } from "./components/LeadAgentList";
import { CategoryCheckBox } from "./components/CategoryCheckBox";
export function LeadAgentPage({ organizationId, }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState(undefined);
    return (<div className="flex h-full w-full">
			<div className="w-1/4 border-r p-4">
				<CategoryCheckBox onCategorySelect={(id) => setSelectedCategoryId(id === null ? undefined : id)} organizationId={organizationId}/>
			</div>
			<div className="w-3/4 overflow-auto">
				<LeadAgentList categoryId={selectedCategoryId} organizationId={organizationId}/>
			</div>
		</div>);
}
