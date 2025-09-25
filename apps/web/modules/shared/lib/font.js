// 本地字体模块 - 替代next/font/google

/**
 * 模拟Next.js Font API的本地字体加载器
 * 用于在不依赖Google Fonts服务的情况下使用Poppins字体
 */

export function Poppins(options = {}) {
  // 提取权重配置（如果有）
  const { weight = ['400', '500', '600', '700'] } = options;
  
  // 记录使用的字重（用于调试）
  if (typeof window !== 'undefined') {
    // 在客户端环境中可以添加日志或其他操作
  }
  
  // 返回与next/font/google兼容的对象结构
  return {
    // 字体名称
    className: 'font-poppins',
    // 字体变量名，通常用于CSS变量
    variable: '--font-sans',
    // 字体文件URLs（本地）
    style: {
      fontFamily: 'Poppins, sans-serif',
    }
  };
}

// 导出默认字体配置，与Next.js API保持一致
export default {
  Poppins
};