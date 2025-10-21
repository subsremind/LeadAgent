"use client";
import Script from "next/script";
const googleTagId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
export function AnalyticsScript() {
    return (<Script async src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} onLoad={() => {
            if (typeof window === "undefined") {
                return;
            }
            window.dataLayer = window.dataLayer || [];
            function gtag(...rest) {
                window.dataLayer.push(...rest);
            }
            gtag("js", new Date());
            gtag("config", googleTagId);
        }}/>);
}
export function useAnalytics() {
    const trackEvent = (event, data) => {
        if (typeof window === "undefined" || !window.gta) {
            return;
        }
        window.gta("event", event, data);
    };
    return {
        trackEvent,
    };
}
