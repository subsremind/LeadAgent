import { getBaseUrl } from "@repo/utils";
import { hc } from "hono/client";
export const apiClient = hc(getBaseUrl(), {
    init: {
        credentials: "include",
    },
}).api;
