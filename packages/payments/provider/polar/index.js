import { Polar } from "@polar-sh/sdk";
import { WebhookVerificationError, validateEvent, } from "@polar-sh/sdk/webhooks.js";
import { db } from "@repo/database";
import { setCustomerIdToEntity } from "../../src/lib/customer";
const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
const polarWebhookSecret = process.env.POLAR_WEBHOOK_SECRET;
if (!polarAccessToken) {
    throw new Error("Missing env variable POLAR_ACCESS_TOKEN");
}
if (!polarWebhookSecret) {
    throw new Error("Missing env variable POLAR_WEBHOOK_SECRET");
}
const polarClient = new Polar({
    accessToken: polarAccessToken,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
export const createCheckoutLink = async (options) => {
    const { productId, redirectUrl, customerId, organizationId, userId } = options;
    const metadata = {};
    if (organizationId) {
        metadata.organization_id = organizationId;
    }
    if (userId) {
        metadata.user_id = userId;
    }
    const response = await polarClient.checkouts.create({
        productPriceId: productId,
        successUrl: redirectUrl ?? "",
        metadata,
        customerId: customerId || undefined,
    });
    return response.url;
};
export const createCustomerPortalLink = async ({ customerId, }) => {
    const response = await polarClient.customerSessions.create({
        customerId: customerId,
    });
    return response.customerPortalUrl;
};
export const setSubscriptionSeats = async () => {
    throw new Error("Not implemented");
};
export const webhookHandler = async (req) => {
    try {
        if (!req.body) {
            return new Response("No body", {
                status: 400,
            });
        }
        const event = validateEvent(await req.text(), Object.fromEntries(req.headers.entries()), polarWebhookSecret);
        switch (event.type) {
            case "order.created": {
                const { metadata, customer, customerId, subscription, productPriceId, } = event.data;
                if (subscription) {
                    break;
                }
                await db.purchase.create({
                    data: {
                        organizationId: metadata?.organization_id || null,
                        userId: metadata?.user_id || null,
                        customerId,
                        type: "ONE_TIME",
                        productId: productPriceId,
                    },
                });
                await setCustomerIdToEntity(customerId, {
                    organizationId: metadata?.organization_id,
                    userId: metadata?.user_id,
                });
                break;
            }
            case "subscription.created": {
                const { metadata, customerId, priceId, id, status } = event.data;
                await db.purchase.create({
                    data: {
                        subscriptionId: id,
                        organizationId: metadata?.organization_id,
                        userId: metadata?.user_id,
                        customerId,
                        type: "SUBSCRIPTION",
                        productId: priceId,
                        status,
                    },
                });
                await setCustomerIdToEntity(customerId, {
                    organizationId: metadata?.organization_id,
                    userId: metadata?.user_id,
                });
                break;
            }
            case "subscription.updated": {
                const { id, status, priceId } = event.data;
                const existingPurchase = await db.purchase.findUnique({
                    where: {
                        subscriptionId: id,
                    },
                });
                if (existingPurchase) {
                    await db.purchase.update({
                        data: {
                            status,
                            productId: priceId,
                        },
                        where: {
                            subscriptionId: id,
                        },
                    });
                }
                break;
            }
            case "subscription.canceled": {
                const { id } = event.data;
                await db.purchase.delete({
                    where: {
                        subscriptionId: id,
                    },
                });
                break;
            }
            default:
                return new Response("Unhandled event type.", {
                    status: 200,
                });
        }
        return new Response(null, {
            status: 202,
        });
    }
    catch (error) {
        if (error instanceof WebhookVerificationError) {
            return new Response("Invalid request.", {
                status: 403,
            });
        }
        throw error;
    }
};
