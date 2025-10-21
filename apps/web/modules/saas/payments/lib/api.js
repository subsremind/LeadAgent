import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
export const createCustomerPortalLinkMutationKey = [
    "create-customer-portal-link",
];
export const useCreateCustomerPortalLinkMutation = () => {
    return useMutation({
        mutationKey: createCustomerPortalLinkMutationKey,
        mutationFn: async (query) => {
            const response = await apiClient.payments["create-customer-portal-link"].$post({
                query,
            });
            if (!response.ok) {
                throw new Error("Failed to create customer portal link");
            }
            return response.json();
        },
    });
};
export const createCheckoutLinkMutationKey = ["create-checkout-link"];
export const useCreateCheckoutLinkMutation = () => {
    return useMutation({
        mutationKey: createCheckoutLinkMutationKey,
        mutationFn: async (query) => {
            const response = await apiClient.payments["create-checkout-link"].$post({
                query,
            });
            if (!response.ok) {
                throw new Error("Failed to create checkout link");
            }
            return response.json();
        },
    });
};
export const purchasesQueryKey = (organizationId) => organizationId
    ? ["organization", "purchases", organizationId]
    : ["user", "purchases"];
export const usePurchasesQuery = (organizationId, options) => {
    return useQuery({
        queryKey: purchasesQueryKey(organizationId),
        queryFn: async () => {
            const response = await apiClient.payments.purchases.$get({
                query: {
                    organizationId,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch purchases");
            }
            return response.json();
        },
        ...options,
    });
};
