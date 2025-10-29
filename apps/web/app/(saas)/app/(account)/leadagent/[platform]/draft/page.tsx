import { DraftPage } from "@saas/leadagent/Draft";

export default async function Page({
  params,
}: {
  params: Promise<{
    platform: string;
  }>;
}) {
  const resolvedParams = await params;
    
    return (
        <div>
            <DraftPage platform={resolvedParams.platform}/>
        </div>
    );
}
