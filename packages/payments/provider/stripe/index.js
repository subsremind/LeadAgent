import { db } from "@repo/database";
import { logger } from "@repo/logs";
import Stripe from "stripe";
import { setCustomerIdToEntity } from "../../src/lib/customer";
let stripeClient = null;
export function getStripeClient() {
    if (stripeClient) {
        return stripeClient;
    }
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        throw new Error("Missing env variable STRIPE_SECRET_KEY");
    }
    stripeClient = new Stripe(stripeSecretKey);
    return stripeClient;
}
export const createCheckoutLink = async (options) => {
    const stripeClient = getStripeClient();
    const { type, productId, redirectUrl, customerId, organizationId, userId, trialPeriodDays, seats, } = options;
    const metadata = {
        organization_id: organizationId || null,
        user_id: userId || null,
    };
    const response = await stripeClient.checkout.sessions.create({
        mode: type === "subscription" ? "subscription" : "payment",
        success_url: redirectUrl ?? "",
        line_items: [
            {
                quantity: seats ?? 1,
                price: productId,
            },
        ],
        customer: customerId,
        ...(type === "one-time"
            ? {
                payment_intent_data: {
                    metadata,
                },
                customer_creation: "always",
            }
            : {
                subscription_data: {
                    metadata,
                    trial_period_days: trialPeriodDays,
                },
            }),
        metadata,
    });
    return response.url;
};
export const createCustomerPortalLink = async ({ customerId, redirectUrl, }) => {
    const stripeClient = getStripeClient();
    const response = await stripeClient.billingPortal.sessions.create({
        customer: customerId,
        return_url: redirectUrl ?? "",
    });
    return response.url;
};
export const setSubscriptionSeats = async ({ id, seats, }) => {
    const stripeClient = getStripeClient();
    const subscription = await stripeClient.subscriptions.retrieve(id);
    if (!subscription) {
        throw new Error("Subscription not found.");
    }
    await stripeClient.subscriptions.update(id, {
        items: [
            {
                id: subscription.items.data[0].id,
                quantity: seats,
            },
        ],
    });
};
export const getInvoices = async ({ customerId }) => {
    const stripeClient = getStripeClient();
    const invoices = await stripeClient.invoices.list({
        customer: customerId,
    });
    return invoices.data.map((invoice) => ({
        id: invoice.id,
        date: invoice.created,
        status: invoice.status ?? undefined,
        downloadUrl: invoice.hosted_invoice_url ?? undefined,
    }));
};
export const webhookHandler = async (req) => {
    const stripeClient = getStripeClient();
    if (!req.body) {
        return new Response("Invalid request.", {
            status: 400,
        });
    }
    let event;
    try {
        event = await stripeClient.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (e) {
        logger.error(e);
        return new Response("Invalid request.", {
            status: 400,
        });
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const { mode, metadata, customer, id } = event.data.object;
                if (mode === "subscription") {
                    break;
                }
                const checkoutSession = await stripeClient.checkout.sessions.retrieve(id, {
                    expand: ["line_items"],
                });
                const productId = checkoutSession.line_items?.data[0].price?.id;
                if (!productId) {
                    return new Response("Missing product ID.", {
                        status: 400,
                    });
                }
                await db.purchase.create({
                    data: {
                        organizationId: metadata?.organization_id || null,
                        userId: metadata?.user_id || null,
                        customerId: customer,
                        type: "ONE_TIME",
                        productId,
                    },
                });
                await setCustomerIdToEntity(customer, {
                    organizationId: metadata?.organization_id,
                    userId: metadata?.user_id,
                });
                break;
            }
            case "customer.subscription.created": {
                const { metadata, customer, items, id } = event.data.object;
                const productId = items?.data[0].price?.id;
                if (!productId) {
                    return new Response("Missing product ID.", {
                        status: 400,
                    });
                }
                await db.purchase.create({
                    data: {
                        subscriptionId: id,
                        organizationId: metadata?.organization_id || null,
                        userId: metadata?.user_id || null,
                        customerId: customer,
                        type: "SUBSCRIPTION",
                        productId,
                        status: event.data.object.status,
                    },
                });
                await setCustomerIdToEntity(customer, {
                    organizationId: metadata?.organization_id,
                    userId: metadata?.user_id,
                });
                break;
            }
            case "customer.subscription.updated": {
                const subscriptionId = event.data.object.id;
                const existingPurchase = await db.purchase.findUnique({
                    where: {
                        subscriptionId,
                    },
                });
                if (existingPurchase) {
                    await db.purchase.update({
                        data: {
                            status: event.data.object.status,
                            productId: event.data.object.items?.data[0].price?.id,
                        },
                        where: {
                            subscriptionId,
                        },
                    });
                }
                break;
            }
            case "customer.subscription.deleted": {
                await db.purchase.delete({
                    where: {
                        subscriptionId: event.data.object.id,
                    },
                });
                break;
            }
            default:
                return new Response("Unhandled event type.", {
                    status: 200,
                });
        }
        return new Response(null, { status: 204 });
    }
    catch (error) {
        return new Response(`Webhook error: ${error instanceof Error ? error.message : ""}`, {
            status: 400,
        });
    }
};
