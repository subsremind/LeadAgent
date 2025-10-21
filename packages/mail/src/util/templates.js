import { render } from "@react-email/render";
import { getMessagesForLocale } from "@repo/i18n";
import { mailTemplates } from "../../emails";
export async function getTemplate({ templateId, context, locale, }) {
    const template = mailTemplates[templateId];
    const translations = await getMessagesForLocale(locale);
    const email = template({
        ...context,
        locale,
        translations,
    });
    const subject = "subject" in translations.mail[templateId]
        ? translations.mail[templateId].subject
        : "";
    const html = await render(email);
    const text = await render(email, { plainText: true });
    return { html, text, subject };
}
