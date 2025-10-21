import "server-only";
import { config } from "@repo/config";
import { cookies } from "next/headers";
export async function getUserLocale() {
    const cookie = (await cookies()).get(config.i18n.localeCookieName);
    return cookie?.value ?? config.i18n.defaultLocale;
}
export async function setLocaleCookie(locale) {
    (await cookies()).set(config.i18n.localeCookieName, locale);
}
export async function getUserTimezone() {
    const cookie = (await cookies()).get(config.i18n.timezoneCookieName);
    return cookie?.value ?? new Intl.DateTimeFormat().resolvedOptions().timeZone;
}
export async function setTimezoneCookie(timezone) {
    (await cookies()).set(config.i18n.timezoneCookieName, timezone);
}
