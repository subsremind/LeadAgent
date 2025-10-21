import { config } from "@repo/config";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
export const localeMiddleware = createMiddleware(async (c, next) => {
    const locale = getCookie(c, config.i18n.localeCookieName) ??
        config.i18n.defaultLocale;
    c.set("locale", locale);
    await next();
});
