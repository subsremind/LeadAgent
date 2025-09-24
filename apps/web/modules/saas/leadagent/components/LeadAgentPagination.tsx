"use client";

import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface LeadAgentPaginationProps {
	currentPage: number;
	totalPages: number;
	pageSize: number;
	totalItems: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	canPreviousPage: boolean;
	canNextPage: boolean;
}

export function LeadAgentPagination({
	currentPage,
	totalPages,
	pageSize,
	totalItems,
	onPageChange,
	onPageSizeChange,
	canPreviousPage,
	canNextPage,
}: LeadAgentPaginationProps) {
	const t = useTranslations();

	const handleFirstPage = () => {
		onPageChange(1);
	};

	const handlePreviousPage = () => {
		if (canPreviousPage) {
			onPageChange(currentPage - 1);
		}
	};

	const handleNextPage = () => {
		if (canNextPage) {
			onPageChange(currentPage + 1);
		}
	};

	const handleLastPage = () => {
		onPageChange(totalPages);
	};

	return (
		<div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                {totalItems} rows
            </div>
			<div className="hidden items-center gap-2 lg:flex">
				<Label htmlFor="rows-per-page" className="text-sm font-medium">
					Rows per page
				</Label>
				<Select
					value={`${pageSize}`}
					onValueChange={(value) => {
						onPageSizeChange(Number(value));
					}}
				>
					<SelectTrigger size="sm" className="w-20" id="rows-per-page">
						<SelectValue placeholder={pageSize} />
					</SelectTrigger>
					<SelectContent side="top">
						{[10, 20, 30, 40, 50].map((size) => (
							<SelectItem key={size} value={`${size}`}>
								{size}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex w-fit items-center justify-center text-sm font-medium">
				Page {currentPage} of {totalPages}
			</div>
			<div className="ml-auto flex items-center gap-2 lg:ml-0">
				<Button
					className="hidden h-8 w-8 p-0 lg:flex"
					onClick={handleFirstPage}
					disabled={!canPreviousPage}
				>
					<span className="sr-only">Go to first page</span>
					<ChevronsLeft className="h-4 w-4" />
				</Button>
				<Button
					className="size-8"
					size="icon"
					onClick={handlePreviousPage}
					disabled={!canPreviousPage}
				>
					<span className="sr-only">Go to previous page</span>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<Button
					className="size-8"
					size="icon"
					onClick={handleNextPage}
					disabled={!canNextPage}
				>
					<span className="sr-only">Go to next page</span>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					className="hidden size-8 lg:flex"
					size="icon"
					onClick={handleLastPage}
					disabled={!canNextPage}
				>
					<span className="sr-only">Go to last page</span>
					<ChevronsRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}