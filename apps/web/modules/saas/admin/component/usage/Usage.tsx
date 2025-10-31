"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@ui/components/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@ui/components/dialog";
import {
	BarChart4Icon,
	DatabaseIcon,
	MessageSquareTextIcon,
	SquareUserRoundIcon,
	CreditCardIcon,
	BoxIcon,
	MessageCircleIcon,
	XIcon,
	TypeOutlineIcon
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@ui/components/chart";


export function Usage() {
	const t = useTranslations();
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
		userUsageStats: usage?.userUsageStats || [],
		userCreditStats: usage?.userCreditStats || [],
		noCreditUsersCount: usage?.noCreditUsersCount || 0,
	};

	// 准备用户信用额度数据
	const prepareCreditData = () => {
		// 完全从API响应获取用户信用数据，不需要计算剩余量
		const rawData = stats.userCreditStats || [];
		return rawData;
	};

	// 为信用额度图表准备的数据
	const creditData = prepareCreditData();



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
	const uniqueUsers = Array.from(new Set(stats.userUsageStats.map((item: any) => item.user)));

	// 通用的用户颜色获取方法
	const getUserColor = (index: number): string => {
		// 颜色数组，为不同用户提供不同颜色
		const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911'];
		return colors[index % colors.length];
	};

	// 通用的Tooltip内容生成函数，在token数据下方显示对应的posts数据
	const renderSortedTooltip = (props: any) => {
		const { active, payload, label } = props;
		if (active && payload && payload.length) {
			// 获取当前日期的数据点，用于查找对应的posts数据
			const currentDataPoint = chartData.find(d => d.date === label);
			if (!currentDataPoint) return null;

			// 按值大小降序排序token数据
			const sortedTokenPayload = [...payload]
				.filter(entry => entry.dataKey?.includes('Tokens'))
				.sort((a: any, b: any) => Number(b.value) - Number(a.value));

			return (
				<div className="bg-white p-4 border border-gray-200 rounded shadow-md">
					<p className="font-medium mb-2">{t("admin.usage.date")}: {label}</p>
					{sortedTokenPayload.map((entry: any, index: number) => {
						const userName = entry.dataKey.replace('Tokens', '');
						const postCount = currentDataPoint[`${userName}Posts`] || 0;
						return (
							<div key={`item-${index}`} style={{ color: entry.color, marginBottom: '4px' }}>
								<p style={{ fontWeight: '500' }}>{userName} (Tokens): {formatNumber(Number(entry.value))}</p>
								<p style={{ fontSize: '13px', opacity: 0.8, marginLeft: '8px' }}>
									 (Posts): {formatNumber(Number(postCount))}
								</p>
							</div>
						);
					})}
				</div>
			);
		}
		return null;
	};

	// 准备图表数据
	const prepareChartData = () => {
		// 获取所有日期
		const allDates = new Set<string>();
		stats.userUsageStats.forEach((record: any) => allDates.add(record.date));

		// 创建合并的数据结构
		const chartData: Record<string, any>[] = [];
		allDates.forEach(date => {
			const dataPoint = { date };
			chartData.push(dataPoint);
		});

		// 按日期排序
		chartData.sort((a, b) => a.date.localeCompare(b.date));

		// 填充用户数据
		stats.userUsageStats.forEach((record: any) => {
			const dataPoint = chartData.find(d => d.date === record.date);
			if (dataPoint) {
				dataPoint[`${record.user}Tokens`] = record.token_usage;
				dataPoint[`${record.user}Posts`] = record.post_count;
			}
		});

		return chartData;
	};


	// 为图表准备的数据
	const chartData = prepareChartData();



	// 打开详情模态框
	const handleViewDetails = () => {
		setIsDetailsOpen(true);
	};

	// 关闭详情模态框
	const handleCloseDetails = () => {
		setIsDetailsOpen(false);
	};
	

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
				{t("admin.usage.usageAnalysis")}
			</h2>

			{/* 顶部数字卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
				<StatCard 
					title={t("admin.usage.totalUsers")} 
					value={formatNumber(stats.totalUsers)} 
					icon={<SquareUserRoundIcon className="text-white" />}
					color="bg-blue-600 text-white"
				/>
				<StatCard 
					title={t("admin.usage.totalTokens")} 
					value={formatNumber(stats.totalTokens)} 
					icon={<TypeOutlineIcon className="text-white" />}
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
				<StatCard 
					title={t("admin.usage.noCreditUsersCount")} 
					value={formatNumber(stats.noCreditUsersCount)} 
					icon={<CreditCardIcon className="text-white" />}
					color="bg-red-600 text-white"
				/>
			</div>
			<Card className="p-6 mb-8">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-semibold">
						{t("admin.usage.tokenUsage")}
					</h3>
					<Button variant="ghost" size="sm" className="text-primary" onClick={handleViewDetails}>
						<BarChart4Icon className="mr-2 h-4 w-4" />
						{t("admin.usage.viewDetails") }
					</Button>
				</div>
				<div className="h-120">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
								data={chartData}
								margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
							>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis 
								dataKey="date"
								tick={{ fontSize: 12 }}
								angle={-45}
								textAnchor="end"
								height={70}
							/>
							{/* Y轴用于Token数据 */}
							<YAxis 
								tickFormatter={formatNumber}
								label={{ value: t("admin.usage.tokens") || "Tokens",  position: 'top', offset: 20, style: { textAnchor: 'middle' } }}
								domain={[0, 'auto']}
							/>
							<Tooltip 
								content={renderSortedTooltip} 
							/>
							<Legend verticalAlign="top" height={36} />
							{/* 只显示Token数据线条 */}
							{uniqueUsers.map((user, index) => (
								<Line 
									key={`token-${user}`}
									dataKey={`${user}Tokens`}
									name={String(user)}
									stroke={getUserColor(index)}
									strokeWidth={2}
									dot={{ r: 4, strokeWidth: 1, fill: '#fff' }}
									activeDot={{ r: 6, strokeWidth: 0 }}
									animationDuration={1500}
								/>
							))}
						</LineChart>
					</ResponsiveContainer>
				</div>
			</Card>
			{/* 用户信用额度表格 */}
			<Card className="p-6 mb-8">
					<CardHeader>
						<CardTitle>{t("admin.usage.creditUsage")}</CardTitle>
						<CardDescription>{t("admin.usage.creditUsageDesc")}</CardDescription>
					</CardHeader>
					<CardContent>
			{creditData.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
									{t("admin.usage.user")}
								</th>
								<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider cursor-help" title="Used/Total/Remaining">
									{t("admin.usage.userCreditUsage")}
								</th>
								<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
									{t("admin.usage.usageRate")}
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{creditData.map((item: any, index: number) => (
								<tr key={`credit-${item.user}-${index}`}>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{item.user}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title={`Used: ${item.usedCredits || 0}\nTotal: ${item.totalCredits || 0}\nRemaining: ${item.remainingCredits || 0}`}>
										{formatNumber(item.usedCredits || 0)}/{formatNumber(item.totalCredits || 0)}/{formatNumber(item.remainingCredits || 0)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.usageRate > 80 ? 'bg-red-100 text-red-800' : item.usageRate > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
											{item.usageRate || 0}%
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="flex items-center justify-center py-12 text-gray-500">
					{t("common.table.empty")}
				</div>
			)}
		</CardContent>
	</Card>

		

		{/* 详情模态框 */}
		<Dialog open={isDetailsOpen} onOpenChange={handleCloseDetails}>
			<DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
					<DialogHeader className="py-4">
						<DialogTitle className="text-lg font-semibold">
							{t("admin.usage.usageDetails")}
						</DialogTitle>
					</DialogHeader>
				
				{/* 可滚动的内容区域 */}
				<div className="flex-1 overflow-y-auto py-4">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin.usage.date")}
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin.usage.user")}
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin.usage.creditUsage")}
									</th>
									<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										{t("admin.usage.postUsage")}
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{stats.userUsageStats.map((record: any, index: number) => (
									<tr key={`${record.date}-${record.user}-${index}`}>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{record.date}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{record.user}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatNumber(record.token_usage)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatNumber(record.post_count)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{stats.userUsageStats.length === 0 && (
						<div className="text-center py-12 text-gray-500">
							{t("common.table.empty")}
						</div>
					)}
				</div>
				
				{/* 固定的底部按钮 */}
					<DialogFooter>
						<Button onClick={handleCloseDetails}>
							{t("common.actions.close")}
						</Button>
					</DialogFooter>
			</DialogContent>
		</Dialog>
	</Card>
	);
}
