# @repo/ai - OpenAI 服务使用指南

## 概述

此包提供了一个通用的OpenAI接口请求方法，用于与OpenAI API交互，包括请求接口、存储响应结果、计算token消耗等功能。

## 特性

- 统一的OpenAI API请求封装
- 自动记录请求和响应（包括token消耗）
- 支持流式响应
- 支持多种OpenAI模型
- 内置成本计算功能
- 支持用户和组织关联

## 安装

```bash
# 在项目根目录运行
pnpm install
```

## 核心组件

### OpenAIService 类

主要的服务类，提供与OpenAI API交互的各种方法。

```typescript
import { OpenAIService, openaiService } from '@repo/ai';
```

### 接口定义

- `OpenAIRequestConfig`: OpenAI请求配置接口
- `OpenAIResponse`: OpenAI响应结果接口
- `AIRequestLog`: AI请求记录接口

## 使用示例

### 1. 使用默认实例

```typescript
import { openaiService } from '@repo/ai';

// 生成文本
const response = await openaiService.generateText('请用一句话解释人工智能是什么', {
  model: 'gpt-3.5-turbo',
  maxTokens: 100,
  temperature: 0.7,
  userId: 'user-123', // 可选：用户ID，用于日志记录
});

console.log(response);
```

### 2. 使用自定义配置进行聊天完成

```typescript
const chatConfig = {
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: '你是一个有用的助手' },
    { role: 'user', content: '如何提高代码质量？' }
  ],
  max_tokens: 200,
  temperature: 0.8,
};

const chatResponse = await openaiService.chatCompletion(chatConfig, {
  organizationId: 'org-456', // 可选：组织ID，用于日志记录
});

console.log(chatResponse.choices[0].message?.content);
console.log('Token使用情况:', chatResponse.usage);
```

### 3. 创建自定义服务实例

```typescript
// 使用自定义API密钥
const customApiKey = process.env.CUSTOM_OPENAI_API_KEY;
const customService = new OpenAIService(customApiKey);

const customResponse = await customService.generateText('什么是TypeScript？', {
  model: 'gpt-3.5-turbo',
});
```

### 4. 流式响应

```typescript
let fullStreamResponse = '';

await openaiService.streamChatCompletion(
  {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '请简单介绍一下React框架' }],
    max_tokens: 150,
  },
  (chunk, isFinal) => {
    fullStreamResponse += chunk;
    console.log(chunk); // 处理每个响应块
    
    if (isFinal) {
      console.log('流式响应完成');
      console.log('完整响应:', fullStreamResponse);
    }
  },
  {
    userId: 'stream-user-789',
  }
);
```

## 配置

### 环境变量

需要设置以下环境变量：

- `OPENAI_API_KEY`: OpenAI API密钥

### 支持的模型

目前支持的模型及其价格（美元/1000 tokens）：

- gpt-3.5-turbo: { prompt: 0.0015, completion: 0.002 }
- gpt-3.5-turbo-1106: { prompt: 0.001, completion: 0.002 }
- gpt-4o: { prompt: 0.005, completion: 0.015 }
- gpt-4-turbo: { prompt: 0.01, completion: 0.03 }
- gpt-4: { prompt: 0.03, completion: 0.06 }

## 日志记录

所有请求都会被记录，包括：

- 请求ID
- 用户ID和组织ID（如果提供）
- 使用的模型
- 提示文本和响应文本
- Token使用情况
- 成本计算
- 请求持续时间
- 成功/失败状态
- 错误信息（如果有）
- 时间戳

## 注意事项

1. 在生产环境中，不要硬编码API密钥，应该使用环境变量或安全的配置管理系统
2. 流式响应中，token使用量是估计值，可能不够准确
3. 日志记录目前是简化版，实际项目中应该实现完整的数据库存储
4. 成本计算基于公开的价格表，可能会随着OpenAI的价格调整而变化

## 示例代码

查看 `examples/openai-service-example.ts` 获取完整的使用示例。