import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";

export const metadata: Metadata = {
	title: {
		absolute: "LeadAgent - Application",
		default: "LeadAgent- Application",
		template: "%s | LeadAgent - Application",
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
