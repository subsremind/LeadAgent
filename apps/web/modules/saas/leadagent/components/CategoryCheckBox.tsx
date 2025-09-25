"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@ui/components/card"
import { Input } from "@ui/components/input";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import { MoreVerticalIcon } from "lucide-react";
import { EditIcon, Trash2Icon } from "lucide-react";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface SubscriptionSidebarProps {
	onCategorySelect: (id: string | null) => void;
}

export function CategoryCheckBox({
	onCategorySelect,
	organizationId,
}: SubscriptionSidebarProps & { organizationId?: string }) {
	const t = useTranslations();
	

	

	const categoriesWithAll = ['reddit'];
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
		null,
	);


	return (
		<div className="@container">
			<Card>
				<CardHeader>
					<CardDescription>Project</CardDescription>
				</CardHeader>
				<CardContent>
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-3">
						<Checkbox id="reddit" checked= {true}/>
						<Label htmlFor="reddit">Reddit</Label>
					</div>
					
				</div>
				</CardContent>
			</Card>
		</div>
	);
}
