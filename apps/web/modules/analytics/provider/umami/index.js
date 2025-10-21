"use client";
import Script from "next/script";
const umamiTrackingId = process.env.NEXT_PUBLIC_UMAMI_TRACKING_ID;
export function AnalyticsScript() {
    return (<Script async type="text/javascript" data-website-id={umamiTrackingId} src="https://analytics.eu.umami.is/script.js"/>);
}
export function useAnalytics() {
    const trackEvent = (event, data) => {
        if (typeof window === "undefined" || !window.umami) {
            return;
        }
        window.umami.track(event, {
            props: data,
        });
    };
    return {
        trackEvent,
    };
}
