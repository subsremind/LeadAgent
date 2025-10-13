"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import {
	BarChart4Icon,
	DatabaseIcon,
	MessageSquareTextIcon,
	SquareUserRoundIcon,
	CreditCardIcon,
	BoxIcon,
	MessageCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";


export function Usage() {
	const t = useTranslations();
	// const queryClient = useQueryClient();
	const { data: usage, isLoading: isUsageLoading } = useQuery({
		queryKey: ["admin-usage"],
		queryFn: async () => {
			const response = await fetch("/api/admin/usage");
			if (!response.ok) {
				throw new Error("Failed to fetch usage");
			}
			return await response.json();
		},
	});

	// 模拟数据
	const stats = {
		totalUsers: usage?.totalUsers || 0,
		totalTokens: usage?.totalTokens || 0,
		totalCategorys: usage?.totalCategorys || 0,
		totalPosts: usage?.totalPosts || 0,
		userTokenUsageRecords: usage?.userTokenUsageRecords || [],
		usersWithAnalyzeCount: usage?.usersWithAnalyzeCount || [],
	};

	// 格式化大数字
	const formatNumber = (num: number) => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	};

	// 获取唯一的用户列表用于颜色分配
	const uniqueTokenUsers = Array.from(new Set(stats.userTokenUsageRecords.map((item: any) => item.user)));
	const uniquePostUsers = Array.from(new Set(stats.usersWithAnalyzeCount.map((item: any) => item.user)));
	

	// 数字卡片组件
	const StatCard = ({ title, value, icon, color }: {
		title: string,
		value: number | string,
		icon: React.ReactNode,
		color: string
	}) => (
		<Card className={`p-6 ${color}`}>
			<div className="flex justify-between items-start">
				<div>
					<p className="text-sm font-medium opacity-80">{title}</p>
					<h3 className="text-2xl font-bold mt-1">{value}</h3>
				</div>
				<div className="p-2 rounded-full bg-white/20">
					{icon}
				</div>
			</div>
		</Card>
	);

	return (
		<Card className="p-6">
			<h2 className="mb-6 font-semibold text-2xl">
				{t("admin.usage.usageAnalysis") || "使用分析"}
			</h2>

			{/* 顶部数字卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard 
					title={t("admin.usage.totalUsers")} 
					value={formatNumber(stats.totalUsers)} 
					icon={<SquareUserRoundIcon className="text-white" />}
					color="bg-blue-600 text-white"
				/>
				<StatCard 
					title={t("admin.usage.totalTokens")} 
					value={formatNumber(stats.totalTokens)} 
					icon={<CreditCardIcon className="text-white" />}
					color="bg-purple-600 text-white"
				/>
				<StatCard 
					title={t("admin.usage.totalCategorys")} 
					value={formatNumber(stats.totalCategorys)} 
					icon={<BoxIcon className="text-white" />}
					color="bg-green-600 text-white"
				/>
				<StatCard 
					title={t("admin.usage.totalPosts")} 
					value={formatNumber(stats.totalPosts)} 
					icon={<MessageCircleIcon className="text-white" />}
					color="bg-orange-600 text-white"
				/>
			</div>

			{/* Token消耗折线图 */}
		<Card className="p-6 mb-8">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-semibold">
					{t("admin.usage.userTokens") }
				</h3>
				<Button variant="ghost" size="sm" className="text-primary">
					<BarChart4Icon className="mr-2 h-4 w-4" />
					{t("admin.usage.viewDetails") }
				</Button>
			</div>
			<div className="h-80">
				<ResponsiveContainer width="100%" height="100%">
					{/* 重构数据：按日期分组，将不同用户的数据合并到同一数据点 */}
					{(() => {
						// 按日期分组数据
						const dateGroups = new Map<string, Record<string, any>>();
						stats.userTokenUsageRecords.forEach((record: any) => {
							const date = record.date;
							if (!dateGroups.has(date)) {
								dateGroups.set(date, { date });
							}
							// 为每个用户创建独立的字段
							const userField = `${record.user}Tokens`;
							dateGroups.get(date)![userField] = record.count;
						});
						// 转换为数组
						const processedData = Array.from(dateGroups.values());
						return (
							<LineChart
								data={processedData}
								margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
							>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis 
									dataKey="date" 
									tick={{ fontSize: 12 }}
									angle={-45}
									textAnchor="end"
									height={70}
								/>
								<YAxis 
									tickFormatter={formatNumber}
								/>
								<Tooltip 
									formatter={(value, user) => [`${formatNumber(Number(value))}`, user]}
									labelFormatter={(label) => t("admin.usage.date") + `: ${label}`}
								/>
								{uniqueTokenUsers.map((user) => (
									<Line 
										dataKey={`${user}Tokens`}
										name={String(user)}
										strokeWidth={2}
										dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
										activeDot={{ r: 6, strokeWidth: 0 }}
										animationDuration={1500}
									/>
								))}
							</LineChart>
						);
					})()}
				</ResponsiveContainer>
			</div>
		</Card>

		{/* 帖子分析折线图 */}
		<Card className="p-6 mb-8">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-semibold">
					{t("admin.usage.postAnalysis")}
				</h3>
				<Button variant="ghost" size="sm" className="text-primary">
					<BarChart4Icon className="mr-2 h-4 w-4" />
					{t("admin.usage.viewDetails") }
				</Button>
			</div>
			<div className="h-80">
				<ResponsiveContainer width="100%" height="100%">
					{/* 重构数据：按日期分组，将不同用户的数据合并到同一数据点 */}
					{(() => {
						// 按日期分组数据
						const dateGroups = new Map<string, Record<string, any>>();
						stats.usersWithAnalyzeCount.forEach((record: any) => {
							const date = record.date;
							if (!dateGroups.has(date)) {
								dateGroups.set(date, { date });
							}
							// 为每个用户创建独立的字段
							const userField = `${record.name}Posts`;
							dateGroups.get(date)![userField] = record.count;
						});
						// 转换为数组
						const processedData = Array.from(dateGroups.values());
						return (
							<LineChart
								data={processedData}
								margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
							>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis 
									dataKey="date" 
									tick={{ fontSize: 12 }}
									angle={-45}
									textAnchor="end"
									height={70}
								/>
								<YAxis 
									allowDecimals={false}
									tickFormatter={formatNumber}
									label={{ value: t("admin.usage.posts"), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
								/>
								<Tooltip 
									formatter={(value, user) => [`${formatNumber(Number(value))}`, user]}
									labelFormatter={(label) => t("admin.usage.date") + `: ${label}`}
								/>
								{uniquePostUsers.map((user) => (
									<Line 
										dataKey={`${user}Posts`}
										name={String(user)}
										strokeWidth={2}
										dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
										activeDot={{ r: 6, strokeWidth: 0 }}
										animationDuration={1500}
									/>
								))}
							</LineChart>
						);
					})()}
				</ResponsiveContainer>
			</div>
		</Card>
	</Card>
	);
}
