import { config } from "@repo/config";
const plans = config.payments.plans;
function getActivePlanFromPurchases(purchases) {
    const subscriptionPurchase = purchases?.find((purchase) => purchase.type === "SUBSCRIPTION");
    if (subscriptionPurchase) {
        const plan = Object.entries(plans).find(([_, plan]) => plan.prices?.some((price) => price.productId === subscriptionPurchase.productId));
        return {
            id: plan?.[0],
            price: plan?.[1].prices?.find((price) => price.productId === subscriptionPurchase.productId),
            status: subscriptionPurchase.status,
            purchaseId: subscriptionPurchase.id,
        };
    }
    const oneTimePurchase = purchases?.find((purchase) => purchase.type === "ONE_TIME");
    if (oneTimePurchase) {
        const plan = Object.entries(plans).find(([_, plan]) => plan.prices?.some((price) => price.productId === oneTimePurchase.productId));
        return {
            id: plan?.[0],
            price: plan?.[1].prices?.find((price) => price.productId === oneTimePurchase.productId),
            status: "active",
            purchaseId: oneTimePurchase.id,
        };
    }
    const freePlan = Object.entries(plans).find(([_, plan]) => plan.isFree);
    return freePlan
        ? {
            id: freePlan[0],
            status: "active",
        }
        : null;
}
export function createPurchasesHelper(purchases) {
    const activePlan = getActivePlanFromPurchases(purchases);
    const hasSubscription = (planIds) => {
        return (!!activePlan &&
            (Array.isArray(planIds)
                ? planIds.includes(activePlan.id)
                : planIds === activePlan.id));
    };
    const hasPurchase = (planId) => {
        return !!purchases?.some((purchase) => Object.entries(plans)
            .find(([id]) => id === planId)?.[1]
            .prices?.some((price) => price.productId === purchase.productId));
    };
    return { activePlan, hasSubscription, hasPurchase };
}
