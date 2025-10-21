import { config } from "@repo/config";
import deepmerge from "deepmerge";
export const importLocale = async (locale) => {
    return (await import(`../translations/${locale}.json`)).default;
};
export const getMessagesForLocale = async (locale) => {
    const localeMessages = await importLocale(locale);
    if (locale === config.i18n.defaultLocale) {
        return localeMessages;
    }
    const defaultLocaleMessages = await importLocale(config.i18n.defaultLocale);
    return deepmerge(defaultLocaleMessages, localeMessages);
};
