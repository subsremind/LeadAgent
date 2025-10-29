import { redirect } from "next/navigation";

// 定义支持的平台列表
const SUPPORTED_PLATFORMS = ["reddit", "x", "linkedin"];

export default async function PlatformPage({
  params,
}: {
  params: {
    platform: string;
  };
}) {
  const { platform } = params;
  
  // 检查平台是否受支持
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    redirect('/not-found');
  }
  
  // 自动重定向到 suggestion 子路由
  redirect(`/app/leadagent/${platform}/suggestion`);
}