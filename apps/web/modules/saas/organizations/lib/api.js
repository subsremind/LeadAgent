import { authClient } from "@repo/auth/client";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
export const organizationListQueryKey = ["user", "organizations"];
export const useOrganizationListQuery = () => {
    return useQuery({
        queryKey: organizationListQueryKey,
        queryFn: async () => {
            const { data, error } = await authClient.organization.list();
            if (error) {
                throw new Error(error.message || "Failed to fetch organizations");
            }
            return data;
        },
    });
};
export const activeOrganizationQueryKey = (slug) => ["user", "activeOrganization", slug];
export const useActiveOrganizationQuery = (slug, options) => {
    return useQuery({
        queryKey: activeOrganizationQueryKey(slug),
        queryFn: async () => {
            const { data, error } = await authClient.organization.getFullOrganization({
                query: {
                    organizationSlug: slug,
                },
            });
            if (error) {
                throw new Error(error.message || "Failed to fetch active organization");
            }
            return data;
        },
        enabled: options?.enabled,
    });
};
export const fullOrganizationQueryKey = (id) => ["fullOrganization", id];
export const useFullOrganizationQuery = (id) => {
    return useQuery({
        queryKey: fullOrganizationQueryKey(id),
        queryFn: async () => {
            const { data, error } = await authClient.organization.getFullOrganization({
                query: {
                    organizationId: id,
                },
            });
            if (error) {
                throw new Error(error.message || "Failed to fetch full organization");
            }
            return data;
        },
    });
};
export const generateOrganizationSlug = async (name) => {
    const response = await apiClient.organizations["generate-slug"].$get({
        query: {
            name,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to generate organization slug");
    }
    const { slug } = await response.json();
    return slug;
};
/*
 * Create organization
 */
export const createOrganizationMutationKey = ["create-organization"];
export const useCreateOrganizationMutation = () => {
    return useMutation({
        mutationKey: createOrganizationMutationKey,
        mutationFn: async ({ name, metadata, }) => (await authClient.organization.create({
            name,
            slug: await generateOrganizationSlug(name),
            metadata,
        })).data,
    });
};
/*
 * Update organization
 */
export const updateOrganizationMutationKey = ["update-organization"];
export const useUpdateOrganizationMutation = () => {
    return useMutation({
        mutationKey: updateOrganizationMutationKey,
        mutationFn: async ({ id, name, metadata, updateSlug, }) => (await authClient.organization.update({
            organizationId: id,
            data: {
                name,
                slug: updateSlug
                    ? await generateOrganizationSlug(name)
                    : undefined,
                metadata,
            },
        })).data,
    });
};
