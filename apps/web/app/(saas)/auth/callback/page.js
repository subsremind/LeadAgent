import { Callback } from "@saas/auth/components/Callback";
import { getTranslations } from "next-intl/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function generateMetadata() {
    const t = await getTranslations();
    return {
        title: t("auth.callback.title"),
    };
}
export default function CallbackPage() {
    return <Callback />;
}
