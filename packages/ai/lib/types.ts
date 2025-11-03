// AI请求记录接口
export interface AIRequestLog {
  id: string;
  userId?: string;
  organizationId?: string;
  model: string;
  business: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  credit?: number;
}

// 通用请求配置接口
export interface CommonRequestConfig {
  model: string;
  messages: Array<{
    role: 'user' | 'system' | 'assistant' | 'function' | 'tool';
    content: string;
    name?: string;
  }>;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

// 通用响应结果接口
export interface CommonAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: any[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}