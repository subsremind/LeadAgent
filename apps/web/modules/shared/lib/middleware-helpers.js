import { apiClient } from "@shared/lib/api-client";
export const getSession = async (req) => {
    const response = await fetch(new URL("/api/auth/get-session?disableCookieCache=true", req.nextUrl.origin), {
        headers: {
            cookie: req.headers.get("cookie") || "",
        },
    });
    if (!response.ok) {
        return null;
    }
    return await response.json();
};
export const getOrganizationsForSession = async (req) => {
    const response = await fetch(new URL("/api/auth/organization/list", req.nextUrl.origin), {
        headers: {
            cookie: req.headers.get("cookie") || "",
        },
    });
    if (!response.ok) {
        return [];
    }
    return (await response.json()) ?? [];
};
export const getPurchasesForSession = async (req, organizationId) => {
    const response = await apiClient.payments.purchases.$get({
        query: {
            organizationId,
        },
    }, {
        headers: {
            cookie: req.headers.get("cookie") || "",
        },
    });
    if (!response.ok) {
        return [];
    }
    const purchases = await response.json();
    return purchases;
};
