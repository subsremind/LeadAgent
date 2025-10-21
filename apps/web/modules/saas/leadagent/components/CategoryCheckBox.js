"use client";
import { Card, CardContent, CardDescription, CardHeader, } from "@ui/components/card";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import { useTranslations } from "next-intl";
import { useState } from "react";
export function CategoryCheckBox({ onCategorySelect, organizationId, }) {
    const t = useTranslations();
    const categoriesWithAll = ['reddit'];
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    return (<div className="@container">
			<Card>
				<CardHeader>
					<CardDescription>Project</CardDescription>
				</CardHeader>
				<CardContent>
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-3">
						<Checkbox id="reddit" checked={true}/>
						<Label htmlFor="reddit">Reddit</Label>
					</div>
					
				</div>
				</CardContent>
			</Card>
		</div>);
}
