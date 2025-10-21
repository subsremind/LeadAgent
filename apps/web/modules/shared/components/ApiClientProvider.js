"use client";
import { createQueryClient } from "@shared/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
let clientQueryClientSingleton;
function getQueryClient() {
    if (typeof window === "undefined") {
        return createQueryClient();
    }
    if (!clientQueryClientSingleton) {
        clientQueryClientSingleton = createQueryClient();
    }
    return clientQueryClientSingleton;
}
export function ApiClientProvider({ children }) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const queryClient = getQueryClient();
    return (<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>);
}
