import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
export const aiChatListQueryKey = (organizationId) => organizationId
    ? ["ai-chat-list", organizationId]
    : ["ai-chat-list"];
export const useAiChatListQuery = (organizationId) => useQuery({
    queryKey: aiChatListQueryKey(organizationId),
    queryFn: async () => {
        const response = await apiClient.ai.chats.$get({
            query: {
                organizationId,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch AI chat list");
        }
        return response.json();
    },
});
export const aiChatQueryKey = (id) => ["ai-chat", id];
export const useAiChatQuery = (id) => useQuery({
    queryKey: aiChatQueryKey(id),
    queryFn: async () => {
        if (id === "new") {
            return null;
        }
        const response = await apiClient.ai.chats[":id"].$get({
            param: {
                id,
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch AI chat");
        }
        return response.json();
    },
});
export const useCreateAiChatMutation = () => {
    return useMutation({
        mutationFn: async ({ title, organizationId, }) => {
            const response = await apiClient.ai.chats.$post({
                json: {
                    title,
                    organizationId,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to create AI chat");
            }
            return response.json();
        },
    });
};
export const updateAiChatMutation = () => {
    return useMutation({
        mutationFn: async ({ id, title }) => {
            const response = await apiClient.ai.chats[":id"].$put({
                param: { id },
                json: { title },
            });
            if (!response.ok) {
                throw new Error("Failed to update AI chat");
            }
            return response.json();
        },
    });
};
export const deleteAiChatMutation = () => {
    return useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.ai.chats[":id"].$delete({
                param: { id },
            });
            if (!response.ok) {
                throw new Error("Failed to delete AI chat");
            }
        },
    });
};
