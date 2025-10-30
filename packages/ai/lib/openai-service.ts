import OpenAI from 'openai';
import { nanoid } from "nanoid";
import { db } from "@repo/database";
import { logger } from "@repo/logs";

// 请求配置接口
export interface OpenAIRequestConfig {
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

// 响应结果接口
export interface OpenAIResponse {
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

// 价格表（美元/1000 tokens）
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
  'gpt-3.5-turbo-1106': { prompt: 0.001, completion: 0.002 },
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'text-embedding-3-small': { prompt: 0.02, completion: 0 }, // embedding模型价格
  // 可以添加更多模型的价格
};


/**
 * OpenAI服务类 - 提供通用的OpenAI接口请求方法
 */
export class OpenAIService {
  private openaiClient: OpenAI;

  constructor(apiKey?: string) {
    // 使用传入的API密钥或从环境变量获取
    const key = apiKey || process.env.OPENAI_API_KEY ||"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";
    if (!key) {
      throw new Error('OpenAI API key is required');
    }

    // 初始化官方OpenAI客户端
    this.openaiClient = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: typeof window !== 'undefined',
    });


  }

  /**
   * 计算请求的成本
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];
    return (promptTokens * pricing.prompt + completionTokens * pricing.completion) / 1000;
  }

  /**
   * 记录AI请求到数据库
   */
  private async logRequest(logData: AIRequestLog): Promise<void> {
    try {
      // 这里简化处理，实际项目中应该有对应的表模型
      // 示例：await db.aiRequestLog.create({ data: logData });
      //console.log('AI Request Log:', logData);
      await db.aiRequestLog.create({ data: logData });
    } catch (error) {
      console.error('Failed to log AI request:', error);
      // 记录失败不应影响主流程
    }
  }

  /**
   * 通用的OpenAI聊天完成请求方法
   */
  async chatCompletion(
    business: string,
    config: OpenAIRequestConfig,
    logOptions?: {
      userId?: string;
      organizationId?: string;
    }
  ): Promise<any> {
    const startTime = Date.now();
    const requestId = nanoid();
    
    try {
      // 执行API请求 - 使用类型断言解决类型不匹配问题
      const response = await this.openaiClient.chat.completions.create(config as any);
      const duration = Date.now() - startTime;

      // 构建提示文本用于日志记录
      let promptText = '';
      if (config.prompt) {
        promptText = config.prompt;
      } else if (config.messages && config.messages.length > 0) {
        promptText = config.messages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
      }

      // 构建响应文本用于日志记录
      const responseText = response.choices.map(choice => 
        choice.message?.content || JSON.stringify(choice.message?.function_call || choice.message?.tool_calls || '')
      ).join('\n');

      // 计算成本
      const cost = this.calculateCost(config.model, response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0);
      // 查询 token 和 credit 的关系，计算 credit
      const tokenCreditRate = await db.adminSetting.findFirst({
        where: {
          key: 'token_credit_mapping',
        },
        select: {
          value: true,
        },
      });

      // 如果没有设置，默认无论多少 tokens 都为 1 credit，计算 credit, totalTokens/creditRate 向上取整数
      let credit = 1;
      const tokenCreditMapping = tokenCreditRate?.value;
      if (tokenCreditMapping) {
        credit = Math.ceil((response.usage?.total_tokens || 0) / Number(tokenCreditMapping));
      } 

      await this.logRequest({
        id: requestId,
        userId: logOptions?.userId,
        organizationId: logOptions?.organizationId,
        model: config.model,
        business,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        cost,
        duration,
        success: true,
        timestamp: new Date(),
        credit,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 记录失败的请求
      await this.logRequest({
        id: requestId,
        userId: logOptions?.userId,
        organizationId: logOptions?.organizationId,
        model: config.model,
        business,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        credit: 0,
      });

      throw error;
    }
  }

  /**
   * 简化的文本生成方法
   */
  async generateText(
    business: string,
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      userId?: string;
      organizationId?: string;
    }
  ): Promise<string> {
    //如果model 是gpt-5, 不用max_tokens 和 temperature 参数
    const config: OpenAIRequestConfig = {
      model: options?.model || 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens,
      temperature: options?.temperature || 0.7,
    };

    if (config.model === 'gpt-5') {
      delete config.max_tokens;
      delete config.temperature;
    }

    const response = await this.chatCompletion(business, config, {
      userId: options?.userId,
      organizationId: options?.organizationId,
    });
    const result = response.choices[0].message?.content || '';
    logger.info('generateText === ', {
      business,
      result,
    });
    return result;
  }

  // 生成查询文本的向量表示
  async generateEmbedding(business: string, userId: string, text: string): Promise<number[]> {
    const startTime = Date.now();
    const requestId = nanoid();
    
    try {
      const response = await this.openaiClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      
      const duration = Date.now() - startTime;
      
      // 获取token使用情况
      const promptTokens = response.usage?.prompt_tokens || 0;
      const totalTokens = response.usage?.total_tokens || 0;
      
      // 计算成本（使用正确的embedding模型价格）
      const cost = this.calculateCost("text-embedding-3-small", promptTokens, 0);
      // 查询 token 和 credit 的关系，计算 credit
      const tokenCreditRate = await db.adminSetting.findFirst({
        where: {
          key: 'token_credit_mapping',
        },
        select: {
          value: true,
        },
      });

      // 如果没有设置，默认无论多少 tokens 都为 1 credit，计算 credit, totalTokens/creditRate 向上取整数
      let credit = 1;
      const tokenCreditMapping = tokenCreditRate?.value;
      if (tokenCreditMapping) {
        credit = Math.ceil((response.usage?.total_tokens || 0) / Number(tokenCreditMapping));
      } 
      
      // 记录请求
      await this.logRequest({
        id: requestId,
        userId,
        model: "text-embedding-3-small",
        business,
        promptTokens,
        completionTokens: 0,
        totalTokens,
        cost,
        duration,
        success: true,
        timestamp: new Date(),
        credit,
      });
      
      // 获取embedding结果
      let embedding = response.data[0].embedding;
      
      // 检查并处理嵌套数组问题，确保返回一维数组
      if (embedding && Array.isArray(embedding) && embedding.length > 0 && Array.isArray(embedding[0])) {
        embedding = embedding.flat();
      }
      
      return embedding;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 记录失败的请求
      await this.logRequest({
        id: requestId,
        model: "text-embedding-3-small",
        business,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        credit: 0,
      });
      
      console.error("Error generating query embedding:", error);
      throw error;
    }
  }

  /**
   * 流式响应方法
   */
  async streamChatCompletion(
    business: string,
    config: OpenAIRequestConfig,
    onChunk: (chunk: string, isFinal: boolean) => void,
    logOptions?: {
      userId?: string;
      organizationId?: string;
    }
  ): Promise<void> {
    const startTime = Date.now();
    const requestId = nanoid();
    let fullResponse = '';
    let totalTokens = 0;
    let promptTokens = 0;

    try {
      // 确保messages存在
      if (!config.messages || config.messages.length === 0) {
        config.messages = [{ role: 'user', content: config.prompt || '' }];
      }
      
      // 设置为流式响应
      const streamConfig = { ...config, stream: true };
      const stream = await this.openaiClient.chat.completions.create(streamConfig as any);

      // 处理流式响应
      const streamAsync = stream as any;
      for await (const chunk of streamAsync) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        
        // 检查是否为最后一个块
        const isFinal = chunk.choices[0]?.finish_reason !== null;
        
        // 回调处理每个块
        onChunk(content, isFinal);
      }

      const duration = Date.now() - startTime;

      // 注意：流式响应中无法直接获取token使用量，这里是估计值
      // 实际项目中可能需要其他方式获取准确的token计数
      const estimatedTokens = Math.round(fullResponse.length / 4); // 粗略估计

      // 记录请求
      await this.logRequest({
        id: requestId,
        userId: logOptions?.userId,
        organizationId: logOptions?.organizationId,
        model: config.model,
        business,
        promptTokens,
        completionTokens: estimatedTokens,
        totalTokens: promptTokens + estimatedTokens,
        duration,
        success: true,
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 记录失败的请求
      await this.logRequest({
        id: requestId,
        userId: logOptions?.userId,
        organizationId: logOptions?.organizationId,
        model: config.model,
        business,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        duration,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        credit: 0,
      });

      throw error;
    }
  }
}

// 创建默认实例
export const openaiService = new OpenAIService();

export default openaiService;
