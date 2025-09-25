import { useSession } from "@saas/auth/hooks/use-session";

export function formatDateWithTimezone(date: Date) {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	const { user } = useSession();
	const locale = user?.locale ?? "en-US";
	const tz =
		user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: tz,
	}).format(dateObj);
}

export function utcDate(date: Date | string) {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	return new Date(
		Date.UTC(
			dateObj.getFullYear(),
			dateObj.getMonth(),
			dateObj.getDate(),
			dateObj.getHours(),
			dateObj.getMinutes(),
			dateObj.getSeconds(),
		),
	);
}

/**
 * 将UTC时间格式化为相对时间显示
 * @param utcDate UTC时间戳（秒）或Date对象或日期字符串
 * @param locale 语言环境，默认为 "zh-CN"
 * @returns 格式化后的相对时间字符串，如 "1分钟前"、"2小时前"、"3天前"
 */
export function formatRelativeTime(utcDate: number | Date | string, locale: string = "en-US"): string {
	// 将输入转换为毫秒时间戳
	let timestamp: number;
	if (typeof utcDate === "number") {
		// 如果是数字，假设是秒级时间戳，转换为毫秒
		timestamp = utcDate * 1000;
	} else if (utcDate instanceof Date) {
		timestamp = utcDate.getTime();
	} else {
		timestamp = new Date(utcDate).getTime();
	}

	const now = Date.now();
	const diffInSeconds = Math.floor((now - timestamp) / 1000);

	// 如果是未来时间，返回"刚刚"
	if (diffInSeconds < 0) {
		return locale.startsWith("zh") ? "刚刚" : "just now";
	}

	// 定义时间单位（秒）
	const timeUnits = {
		year: 365 * 24 * 60 * 60,
		month: 30 * 24 * 60 * 60,
		day: 24 * 60 * 60,
		hour: 60 * 60,
		minute: 60,
		second: 1,
	};

	// 中文单位映射
	const chineseUnits = {
		year: "年",
		month: "个月",
		day: "天",
		hour: "小时",
		minute: "分钟",
		second: "秒",
	};

	// 英文单位映射
	const englishUnits = {
		year: "year",
		month: "month",
		day: "day",
		hour: "hour",
		minute: "minute",
		second: "second",
	};

	// 查找合适的时间单位
	for (const [unit, seconds] of Object.entries(timeUnits)) {
		const value = Math.floor(diffInSeconds / seconds);
		if (value > 0) {
			if (locale.startsWith("zh")) {
				return `${value}${chineseUnits[unit as keyof typeof chineseUnits]}前`;
			} else {
				const unitText = englishUnits[unit as keyof typeof englishUnits];
				return `${value} ${unitText}${value > 1 ? "s" : ""} ago`;
			}
		}
	}

	// 如果时间差小于1秒，返回"刚刚"
	return locale.startsWith("zh") ? "刚刚" : "just now";
}
