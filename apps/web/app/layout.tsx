import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";

import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: {
      absolute: `${t("app.name")} - Application`,
      default: `${t("app.name")}- Application`,
      template: `%s | ${t("app.name")} - Application`,
    },
  };
}

export default function RootLayout({ children }: PropsWithChildren) {
	
	return children;
}
