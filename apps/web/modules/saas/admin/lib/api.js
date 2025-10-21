import { apiClient } from "@shared/lib/api-client";
import { createQueryKeyWithParams } from "@shared/lib/query-client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
export const adminUsersQueryKey = ["admin", "users"];
export const fetchAdminUsers = async ({ itemsPerPage, currentPage, searchTerm, }) => {
    const response = await apiClient.admin.users.$get({
        query: {
            limit: itemsPerPage.toString(),
            offset: ((currentPage - 1) * itemsPerPage).toString(),
            query: searchTerm,
        },
    });
    if (!response.ok) {
        throw new Error("Could not fetch users");
    }
    return response.json();
};
export const useAdminUsersQuery = (params) => {
    return useQuery({
        queryKey: createQueryKeyWithParams(adminUsersQueryKey, params),
        queryFn: () => fetchAdminUsers(params),
        retry: false,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });
};
export const adminOrganizationsQueryKey = ["admin", "organizations"];
export const fetchAdminOrganizations = async ({ itemsPerPage, currentPage, searchTerm, }) => {
    const response = await apiClient.admin.organizations.$get({
        query: {
            limit: itemsPerPage.toString(),
            offset: ((currentPage - 1) * itemsPerPage).toString(),
            query: searchTerm,
        },
    });
    if (!response.ok) {
        throw new Error("Could not fetch organizations");
    }
    return response.json();
};
export const useAdminOrganizationsQuery = (params) => {
    return useQuery({
        queryKey: createQueryKeyWithParams(adminOrganizationsQueryKey, params),
        queryFn: () => fetchAdminOrganizations(params),
        retry: false,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });
};
