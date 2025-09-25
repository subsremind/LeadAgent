# Poppins Font - 本地使用指南

这个目录用于存放Poppins字体文件，以避免从Google Fonts API加载字体时出现的连接问题。

## 如何获取Poppins字体文件

由于直接从Google Fonts下载字体文件可能存在许可问题，建议通过以下合法途径获取：

1. 从[Google Fonts官方网站](https://fonts.google.com/specimen/Poppins)下载字体文件
2. 或者从其他合法的字体分发网站获取

## 需要的字体文件

请确保获取以下字重的字体文件（建议使用woff2格式以获得最佳性能）：

- Poppins-Regular.woff2 (400)
- Poppins-Medium.woff2 (500)
- Poppins-SemiBold.woff2 (600)
- Poppins-Bold.woff2 (700)

## 安装步骤

1. 将下载的字体文件放入此目录
2. 确保文件名与`poppins.css`中引用的文件名完全一致
3. 重新启动开发服务器

## 关于字体许可

请确保遵守Poppins字体的许可协议。Poppins字体通常在Open Font License下发布，但请在使用前确认具体许可条款。

## 故障排除

如果字体未正确加载，请检查：
- 字体文件是否存在于正确的位置
- 文件名是否与CSS中引用的一致
- 浏览器控制台是否有任何错误消息