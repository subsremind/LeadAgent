import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";
import "cropperjs/dist/cropper.css";

export const metadata: Metadata = {
	title: {
		absolute: "LeadsAgent - Application",
		default: "LeadsAgent- Application",
		template: "%s | LeadsAgent - Application",
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return children;
}
