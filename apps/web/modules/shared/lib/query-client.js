import { QueryClient, defaultShouldDehydrateQuery, } from "@tanstack/react-query";
export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000,
                retry: false,
            },
            dehydrate: {
                shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) ||
                    query.state.status === "pending",
            },
        },
    });
}
export function createQueryKeyWithParams(key, params) {
    return [
        ...(Array.isArray(key) ? key : [key]),
        Object.entries(params)
            .reduce((acc, [key, value]) => {
            acc.push(`${key}:${value}`);
            return acc;
        }, [])
            .join("_"),
    ];
}
