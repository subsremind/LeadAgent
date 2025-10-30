export function getBaseUrl() {
	// 优先使用环境变量
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}
	
	if (typeof window !== 'undefined') {
		return window.location.origin;
	}
	
	// 仅在服务器端回退到localhost
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
