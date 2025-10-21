import { AuthWrapper } from "@saas/shared/components/AuthWrapper";
export default function WithoutOrganizationSlugLayout({ children, }) {
    return <AuthWrapper>{children}</AuthWrapper>;
}
