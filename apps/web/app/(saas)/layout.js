import { Document } from "@shared/components/Document";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
export default async function LocaleLayout({ children }) {
    const locale = await getLocale();
    const messages = await getMessages();
    return (<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				{children}
			</NextIntlClientProvider>
		</Document>);
}
