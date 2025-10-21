"use client";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { OrganizationsGrid } from "@saas/organizations/components/OrganizationsGrid";
import { Card, CardHeader, CardTitle, CardContent } from "@ui/components/card";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { CheckCircle2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
export default function UserStart() {
    const t = useTranslations();
    const { user } = useSession();
    return (<div>
			{config.organizations.enable && <OrganizationsGrid />}

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>User Guide</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert className="mb-4">
						<Badge className="bg-sky-600 text-white flex items-center gap-1 max-w-[fit-content] mb-2">
							<CheckCircle2Icon size={12}/>
							Step 1
						</Badge>
						<AlertTitle>Configure Your Agent: Define Your Business Identity and Goals</AlertTitle>
						<AlertDescription>
						Navigate to the  "Lead Agent" page, click on "Agent Setup" button. Here, please provide a clear description of your business vision and specify key query keywords. This information is crucial as it forms the foundation for how the system retrieves and filters relevant content for you.
						</AlertDescription>
					</Alert>
					<Alert className="mb-4" variant="default">
						<Badge className="bg-sky-600 text-white flex items-center gap-1 max-w-[fit-content] mb-2">
							<CheckCircle2Icon size={12}/>
							Step 2
						</Badge>
						<AlertTitle>Review Your Lead Feed: Discover Insights and Opportunities</AlertTitle>
						<AlertDescription>
						Go to the "Lead Agent" page. The system will automatically present a curated list of discussions, market signals, and potential leads based on your configuration. The content is organized chronologically for easy tracking of the latest updates.
						</AlertDescription>
					</Alert>
					<Alert className="mb-4">
						<Badge className="bg-sky-600 text-white flex items-center gap-1 max-w-[fit-content] mb-2">
							<CheckCircle2Icon size={12}/>
							Step 3
						</Badge>
						<AlertTitle>Engage and Refine: Take Action and Optimize Results</AlertTitle>
						<AlertDescription>
						Click into any item on the "Lead Agent" feed to view detailed information and participate in conversations. Continuously refine the keywords and settings in "Agent Setup" based on the quality of leads you receive to improve the system's accuracy over time.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>);
}
