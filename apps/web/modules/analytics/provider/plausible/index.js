"use client";
import Script from "next/script";
const plausibleUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;
export function AnalyticsScript() {
    return (<Script defer type="text/javascript" data-domain={plausibleUrl} src="https://plausible.io/js/script.js"/>);
}
export function useAnalytics() {
    const trackEvent = (event, data) => {
        if (typeof window === "undefined" || !window.plausible) {
            return;
        }
        window.plausible(event, {
            props: data,
        });
    };
    return {
        trackEvent,
    };
}
