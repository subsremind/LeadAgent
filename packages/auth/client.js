import { adminClient, inferAdditionalFields, magicLinkClient, organizationClient, passkeyClient, } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
    plugins: [
        inferAdditionalFields(),
        magicLinkClient(),
        organizationClient(),
        adminClient(),
        passkeyClient(),
    ],
});
