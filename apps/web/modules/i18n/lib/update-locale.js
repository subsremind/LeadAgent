"use server";
import { setLocaleCookie, setTimezoneCookie } from "@i18n/lib/locale-cookie";
import { revalidatePath } from "next/cache";
export async function updateLocale(locale) {
    await setLocaleCookie(locale);
    revalidatePath("/");
}
export async function updateTimezone(timezone) {
    await setTimezoneCookie(timezone);
}
