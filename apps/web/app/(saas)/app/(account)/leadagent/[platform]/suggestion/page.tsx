import { SuggestionPage } from "@saas/leadagent/Suggestion";

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
        <SuggestionPage platform={resolvedParams.platform} />
      </div>
  );
}
