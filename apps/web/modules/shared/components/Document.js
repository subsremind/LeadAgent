import { AnalyticsScript } from "@analytics";
import { config } from "@repo/config";
import { ApiClientProvider } from "@shared/components/ApiClientProvider";
import { Toaster } from "@ui/components/toast";
import { cn } from "@ui/lib";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Poppins } from "@shared/lib/font";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";
const sansFont = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-sans",
});
export function Document({ children, locale, }) {
    // 预加载本地字体CSS
    if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/fonts/poppins/poppins.css';
        link.crossOrigin = 'anonymous';
        if (!document.head.querySelector('link[href="/fonts/poppins/poppins.css"]')) {
            document.head.appendChild(link);
        }
    }
    return (<html lang={locale} suppressHydrationWarning>
			<head>
				{/* 确保字体CSS在服务器端也被加载 */}
				<link rel="stylesheet" href="/fonts/poppins/poppins.css" crossOrigin="anonymous"/>
			</head>
			<body className={cn("min-h-screen bg-background font-sans text-foreground antialiased", sansFont.variable)}>
				<NuqsAdapter>
					<NextTopLoader color="var(--color-primary)"/>
					<ThemeProvider attribute="class" disableTransitionOnChange enableSystem defaultTheme={config.ui.defaultTheme} themes={config.ui.enabledThemes}>
						<ApiClientProvider>
							<JotaiProvider>{children}</JotaiProvider>
						</ApiClientProvider>
					</ThemeProvider>
					<Toaster position="top-right"/>
					<AnalyticsScript />
				</NuqsAdapter>
			</body>
		</html>);
}
