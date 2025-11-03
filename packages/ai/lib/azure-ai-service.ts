import OpenAI from 'openai';
import { nanoid } from "nanoid";
import { db } from "@repo/database";
import { logger } from "@repo/logs";
import { CommonRequestConfig, CommonAIResponse, AIRequestLog } from './types';

// Azure AI特定的请求配置接口
export interface AzureAIRequestConfig extends CommonRequestConfig {}

// Azure AI特定的响应结果接口
export interface AzureAIResponse extends CommonAIResponse {}

// Azure OpenAI 价格表（美元/1000 tokens）
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-35-turbo': { prompt: 0.0015, completion: 0.002 },
  'gpt-35-turbo-1106': { prompt: 0.001, completion: 0.002 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'text-embedding-ada-002': { prompt: 0.0001, completion: 0 }, // Azure embedding模型价格
  'text-embedding-3-small': { prompt: 0.02, completion: 0 },
  // 可以添加更多Azure模型的价格
};

/**
 * Azure AI服务类 - 提供通用的Azure OpenAI接口请求方法
 */
export class AzureAIService {
  private options: {
    apiKey?: string;
    endpoint?: string;
    apiVersion?: string;
    deploymentName?: string;
  } | undefined;
  private _azureClient: OpenAI | null = null;

  get azureClient(): OpenAI {
    if (!this._azureClient) {
      this._azureClient = this.initializeClient();
    }
    return this._azureClient;
  }

  constructor(options?: {
    apiKey?: string;
    endpoint?: string;
    apiVersion?: string;
    deploymentName?: string;
  }) {
    this.options = options;
  }

  /**
   * 初始化Azure OpenAI客户端，仅在实际使用时验证配置
   */
  private initializeClient(): OpenAI {
    // 使用传入的配置或从环境变量获取
    const apiKey = this.options?.apiKey || process.env.AZURE_OPENAI_API_KEY;
    const endpoint = this.options?.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = this.options?.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2023-05-15';
    const deploymentName = this.options?.deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT || '';

    if (!apiKey) {
      throw new Error('Azure OpenAI API key is required');
    }
    
    if (!endpoint) {
      throw new Error('Azure OpenAI endpoint is required');
    }
    
    if (!deploymentName) {
      throw new Error('Azure OpenAI deployment name is required. Please provide a valid deployment ID.');
    }

    return new OpenAI({
      apiKey: apiKey,
      baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
      defaultQuery: { 'api-version': apiVersion },
      dangerouslyAllowBrowser: typeof window !== 'undefined',
    });
  }

  /**
   * 计算请求的成本
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-35-turbo'];
    return (promptTokens * pricing.prompt + completionTokens * pricing.completion) / 1000;
  }

  /**
   * 记录AI请求到数据库
   */
  private async logRequest(logData: AIRequestLog): Promise<void> {
    try {
      await db.aiRequestLog.create({ data: logData });
    } catch (error) {
      console.error('Failed to log AI request:', error);
      // 记录失败不应影响主流程
    }
  }

  /**
   * 通用的Azure OpenAI聊天完成请求方法
   */
  async chatCompletion(
    business: string,
    config: AzureAIRequestConfig,
    logOptions?: {
      userId?: string;
      organizationId?: string;
    }
  ): Promise<any> {
    const startTime = Date.now();
    const requestId = nanoid();
    
    try {
      // 执行API请求 - 使用类型断言解决类型不匹配问题
      const response = await this.azureClient.chat.completions.create(config as any);
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
    // 如果model 是gpt-5, 不用max_tokens 和 temperature 参数
    const config: AzureAIRequestConfig = {
      model: options?.model || 'gpt-35-turbo', // Azure默认使用gpt-35-turbo
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens,
      temperature: options?.temperature || 0.7,
    };

    if (config.model.includes('gpt-5')) {
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
      const response = await this.azureClient.embeddings.create({
        model: "text-embedding-ada-002", // Azure默认使用的embedding模型
        input: text,
      });
      
      const duration = Date.now() - startTime;
      
      // 获取token使用情况
      const promptTokens = response.usage?.prompt_tokens || 0;
      const totalTokens = response.usage?.total_tokens || 0;
      
      // 计算成本
      const cost = this.calculateCost("text-embedding-ada-002", promptTokens, 0);
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
        model: "text-embedding-ada-002",
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
        model: "text-embedding-ada-002",
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
    config: AzureAIRequestConfig,
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
      const stream = await this.azureClient.chat.completions.create(streamConfig as any);

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
export const azureAIService = new AzureAIService();

export default azureAIService;