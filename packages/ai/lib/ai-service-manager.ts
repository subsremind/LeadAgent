import { db } from "@repo/database";
import { OpenAIService, OpenAIRequestConfig } from "./openai-service";
import { AzureAIService, AzureAIRequestConfig } from "./azure-ai-service";
import { logger } from "@repo/logs";

// 自定义错误类，用于区分业务错误和服务器错误
export class InsufficientCreditsError extends Error {
  constructor(message: string = 'Insufficient credits to use AI service') {
    super(message);
    this.name = 'InsufficientCreditsError';
    // 确保在继承链上正确设置原型
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}

// 平台类型定义
export type AIPlatform = 'openai' | 'azure' | 'auto';

// Azure配置接口
export interface AzureConfig {
  apiKey?: string;
  endpoint?: string;
  apiVersion?: string;
  deploymentName?: string;
}

// OpenAI配置接口
export interface OpenAIConfig {
  apiKey?: string;
}

// 统一配置接口
export interface PlatformConfig {
  platform?: AIPlatform;
  config?: AzureConfig | OpenAIConfig;
}

// 服务配置接口
export interface AIServiceConfig {
  platform?: AIPlatform;
  openaiConfig?: OpenAIConfig;
  azureConfig?: AzureConfig;
}

// 统一的请求配置接口
export interface AIRequestConfig extends Omit<OpenAIRequestConfig, 'model'> {
  model?: string;
}

/**
 * AI服务管理器 - 根据配置动态选择使用OpenAI或Azure AI平台
 */
export class AIServiceManager {
  private config: AIServiceConfig;
  private openaiService: OpenAIService | null = null;
  private azureService: AzureAIService | null = null;
  private cachedPlatform: AIPlatform | null = null;
  private cachedConfig: any = null;
  private lastCheckTime: number = 0;
  private checkInterval: number = 5 * 60 * 1000; // 5分钟检查一次配置变化

  constructor(config?: AIServiceConfig) {
    this.config = config || {};
  }

  /**
   * 从数据库获取配置的AI平台和详细配置
   */
  private async getConfiguredPlatformAndConfig(): Promise<{platform: AIPlatform; config?: any}> {
    const currentTime = Date.now();
    
    // 如果缓存有效且未过期，直接返回
    if (this.cachedPlatform && (currentTime - this.lastCheckTime) < this.checkInterval) {
      return { platform: this.cachedPlatform, config: this.cachedConfig };
    }

    try {
      const platformSetting = await db.adminSetting.findFirst({
        where: {
          key: 'ai_platform',
        },
        select: {
          value: true,
        },
      });

      let platform: AIPlatform = 'openai';
      let config: any = undefined;

      if (platformSetting?.value) {
        try {
          // 尝试解析JSON格式的配置
          const parsedConfig = JSON.parse(platformSetting.value) as PlatformConfig;
          platform = parsedConfig.platform || 'openai';
          config = parsedConfig.config;
        } catch (parseError) {
          // 如果解析失败，尝试将值作为简单的平台名称处理
          console.warn('Failed to parse AI platform JSON config, using as platform name:', parseError);
          platform = (platformSetting.value as AIPlatform) || 'openai';
        }
      }

      // 更新缓存和时间戳
      this.cachedPlatform = platform;
      this.cachedConfig = config;
      this.lastCheckTime = currentTime;
      
      return { platform, config };
    } catch (error) {
      console.error('Failed to get AI platform setting:', error);
      // 出错时默认使用OpenAI
      return { platform: 'openai' };
    }
  }

  /**
   * 检查用户是否有足够的 credits 可用
   */
  private async hasAvailableCredits(logOptions?: {
    userId?: string;
    organizationId?: string;
  }): Promise<boolean> {
    try {
      
      if (logOptions?.userId) {
        const creditStatus = await db.$queryRaw<{hasCredits: boolean}>`
                  with de as (
                    select "value"::integer "default_credit" from admin_setting as2 where "key" = 'default_credit'
                  )
                  select coalesce(ucu.credit,0) <
                  coalesce(ucs.credit, (select "default_credit" from de)) as "hasCredits"
                  from public.user u
                  left join user_credit_usage ucu on u.id = ucu."userId" 
                  left join user_credit_setting ucs on u.id  = ucs."userId"
                  where u.id = ${logOptions.userId} limit 1`;
        logger.info(`User ${logOptions.userId} credit status: ${JSON.stringify(creditStatus)}`);
        if (!creditStatus?.hasCredits) {
          logger.error(`User ${logOptions.userId} has no available credits`);
          return false;
        }
      }
      return true;
    } catch (error) {
      // 出错时默认允许使用，避免影响现有功能
      logger.error(`Failed to check available credits for user ${logOptions?.userId}: ${error}`);
      return true;
    }
  }

  /**
   * 获取当前应该使用的服务实例
   */
  private async getCurrentService(): Promise<OpenAIService | AzureAIService> {
    const { platform, config } = await this.getConfiguredPlatformAndConfig();

    if (platform === 'azure') {
      if (!this.azureService) {
        // 优先使用数据库配置，其次使用构造函数传入的配置
        const azureConfig = config || this.config.azureConfig;
        
        // 前后端统一使用deploymentName字段
        const processedAzureConfig = azureConfig;
        
        this.azureService = new AzureAIService(processedAzureConfig as any);
      }
      return this.azureService;
    } else {
      // 默认使用OpenAI
      if (!this.openaiService) {
        // 优先使用数据库配置，其次使用构造函数传入的配置
        const openaiApiKey = config?.apiKey || this.config.openaiConfig?.apiKey;
        this.openaiService = new OpenAIService(openaiApiKey);
      }
      return this.openaiService;
    }
  }

  /**
   * 清除缓存，下次请求时重新从数据库获取配置
   */
  public clearCache(): void {
    this.cachedPlatform = null;
    this.cachedConfig = null;
    this.lastCheckTime = 0;
    // 清除服务实例缓存，确保下次使用新配置创建实例
    this.openaiService = null;
    this.azureService = null;
  }

  /**
   * 手动设置平台类型和配置
   */
  public setPlatformAndConfig(platform: AIPlatform, config?: any): void {
    this.cachedPlatform = platform;
    this.cachedConfig = config;
    this.lastCheckTime = Date.now();
    // 清除服务实例缓存，确保下次使用新配置创建实例
    this.openaiService = null;
    this.azureService = null;
  }

  /**
   * 手动设置平台类型（兼容旧接口）
   */
  public setPlatform(platform: AIPlatform): void {
    this.setPlatformAndConfig(platform);
  }

  /**
   * 通用的聊天完成请求方法
   */
  async chatCompletion(
    business: string,
    config: AIRequestConfig,
    logOptions?: {
      userId?: string;
      organizationId?: string;
    }
  ): Promise<any> {
    // 检查是否有可用的 credits
    const hasCredits = await this.hasAvailableCredits(logOptions);
    if (!hasCredits) {
      throw new InsufficientCreditsError('Insufficient credits to use AI service');
    }
    
    const service = await this.getCurrentService();
    return service.chatCompletion(business, config as any, logOptions);
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
    // 检查是否有可用的 credits
    const logOptions = {
      userId: options?.userId,
      organizationId: options?.organizationId
    };
    const hasCredits = await this.hasAvailableCredits(logOptions);
    if (!hasCredits) {
      throw new InsufficientCreditsError('Insufficient credits to use AI service');
    }
    
    const service = await this.getCurrentService();
    return service.generateText(business, prompt, options);
  }

  /**
   * 生成查询文本的向量表示
   */
  async generateEmbedding(business: string, userId: string, text: string): Promise<number[]> {
    // 检查是否有可用的 credits
    const logOptions = { userId };
    const hasCredits = await this.hasAvailableCredits(logOptions);
    if (!hasCredits) {
      throw new InsufficientCreditsError('Insufficient credits to use AI service');
    }
    
    const service = await this.getCurrentService();
    return service.generateEmbedding(business, userId, text);
  }

  /**
   * 流式响应方法
   */
  async streamChatCompletion(
    business: string,
    config: AIRequestConfig,
    onChunk: (chunk: string, isFinal: boolean) => void,
    logOptions?: {
      userId?: string;
      organizationId?: string;
    }
  ): Promise<void> {
    // 检查是否有可用的 credits
    const hasCredits = await this.hasAvailableCredits(logOptions);
    if (!hasCredits) {
      // 对于流式响应，调用 onChunk 通知客户端错误
      onChunk('Insufficient credits to use AI service', true);
      throw new InsufficientCreditsError('Insufficient credits to use AI service');
    }
    
    const service = await this.getCurrentService();
    return service.streamChatCompletion(business, config as any, onChunk, logOptions);
  }
}

// 创建默认实例
export const aiServiceManager = new AIServiceManager();

export default aiServiceManager;