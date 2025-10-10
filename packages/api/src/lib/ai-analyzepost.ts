import { db, RedditPost } from "@repo/database";
import { logger } from "@repo/logs";
import { config } from "@repo/config";
import { openaiService } from "@repo/ai";
import { promptAiAnalyzeQuery } from "@repo/ai";

// 定义查询结果的接口
interface UnanalyzedPostData {
  redditId: string;
  title: string;
  selftext: string | null;
  categoryId: string | null;
  path: string;
  userId: string;
  query: string;
  subreddit: string | null;
}

// 定义AI分析结果的接口
interface AIAnalysisResult {
  confidence: number;
  relation: string;
  reason: string;
}

/**
 * 获取未分析的Reddit帖子数据
 * @returns 未分析的帖子数组
 */
async function fetchUnanalyzedPosts(): Promise<UnanalyzedPostData[]> {
  logger.info("执行SQL查询获取未分析的Reddit帖子");
  
  const unanalyzedPosts = await db.$queryRaw<UnanalyzedPostData[]>`
        SELECT 
      rp."redditId", 
      rp.title, 
      rp.selftext, 
      rp."categoryId", 
      ca.path, 
      aset."userId", 
      aset.query, 
      aset.subreddit 
    FROM agent_setting aset 
    LEFT JOIN category ca 
      ON aset.subreddit LIKE '%' || ca.name || '%' 
    INNER JOIN reddit_post rp 
      ON rp."categoryId" = ca.id	  
	  WHERE 
   Not EXISTS (
    SELECT 1 
    FROM ai_analyze_record aar 
    WHERE aar.reddit_id = rp."redditId" 
      AND aar.user_id = aset."userId"
) and rp.selftext is not null and rp.selftext <> ''`;

  logger.info(`SQL查询完成，找到 ${unanalyzedPosts.length} 条未分析的帖子`);
  return unanalyzedPosts;
}

export async function getNoAnalyzePost() {
  try {
    // 1. 获取未分析的帖子
    const unanalyzedPosts = await fetchUnanalyzedPosts();
    logger.info(`找到 ${unanalyzedPosts.length} 条未分析的帖子`);

    if (unanalyzedPosts.length === 0) {
      return;
    }

    // 2. 批量处理帖子
    const batchSize = 10;
    const result = await processBatchPosts(unanalyzedPosts, batchSize);

    logger.info(`AI分析完成，总共处理: ${result.processed}/${result.total} 条帖子`);

    return {
      success: true,
      processed: result.processed,
      total: result.total,
      message: `成功分析 ${result.processed} 条帖子`
    };

  } catch (error) {
    logger.error("获取和分析未分析帖子时发生错误:", error);
    throw new Error(`AI分析处理失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 解析和验证AI分析结果
 * @param analysisResult AI返回的原始结果字符串
 * @param postId 帖子ID（用于日志）
 * @returns 解析后的AI分析结果或null（如果解析失败）
 */
function parseAndValidateAIResult(analysisResult: string, postId: string): AIAnalysisResult | null {
  try {
    // 检查返回结果是否为纯字符串（非JSON格式），如果是则跳过处理
    const trimmedResult = analysisResult.trim();
    if (!trimmedResult.startsWith('{') && !trimmedResult.startsWith('```')) {
      logger.info(`AI返回纯字符串结果，跳过处理，帖子ID: ${postId}，内容: ${trimmedResult}`);
      return null;
    }
    
    // 清理AI返回的结果，移除可能的markdown代码块标记
    let cleanedResult = trimmedResult;
    
    // 移除开头的 ```json 或 ``` 标记
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '');
    }
    
    // 移除结尾的 ``` 标记
    if (cleanedResult.endsWith('```')) {
      cleanedResult = cleanedResult.replace(/\s*```$/, '');
    }
    
    // 移除多余的空白字符
    cleanedResult = cleanedResult.trim();
    
    logger.info(`清理后的AI结果，帖子ID: ${postId}，内容: ${cleanedResult}`);
    
    // 解析AI返回的JSON结果
    const parsedResult: AIAnalysisResult = JSON.parse(cleanedResult);
    
    // 验证解析结果的格式
    if (
      typeof parsedResult.confidence !== 'number' ||
      parsedResult.confidence < 0 ||
      parsedResult.confidence > 1 ||
      typeof parsedResult.relation !== 'string' ||
      parsedResult.relation.trim() === '' ||
      typeof parsedResult.reason !== 'string' ||
      parsedResult.reason.trim() === ''
    ) {
      logger.error(`AI结果格式不正确，帖子ID: ${postId}，解析结果:`, parsedResult);
      return null;
    }
    return parsedResult;

  } catch (parseError) {
    logger.error(`AI结果解析失败，帖子ID: ${postId}，原始结果: ${analysisResult}`, parseError);
    return null;
  }
}

/**
 * 保存AI分析结果到数据库
 * @param post 帖子数据
 * @param analysisResult 解析后的AI分析结果
 * @returns 是否保存成功
 */
async function saveAnalysisResult(post: UnanalyzedPostData, analysisResult: AIAnalysisResult): Promise<boolean> {
  try {
    await db.aiAnalyzeRecord.create({
      data: {
        userId: post.userId,
        redditId: post.redditId,
        categoryId: post.categoryId,
        confidence: analysisResult.confidence.toString(),
        result: {
          confidence: analysisResult.confidence,
          relation: analysisResult.relation,
          reason: analysisResult.reason
        }
      }
    });
    return true;

  } catch (error) {
    logger.error(`保存分析结果失败，帖子ID: ${post.redditId}`, error);
    return false;
  }
}

export function toUtcDate(ts: string | number | null | undefined): Date | null {
  if (ts == null) return null;
  const n = Number(ts);
  if (Number.isNaN(n)) return null;
  // 10 位秒 → 13 位毫秒
  const ms = n < 1e11 ? n * 1000 : n;
  return new Date(ms);
}


/**
 * 对单个帖子进行AI分析
 * @param post 帖子数据
 * @returns AI分析结果字符串或null（如果失败）
 */
async function analyzePostWithAI(post: UnanalyzedPostData): Promise<string | null> {
  try {
    logger.info(`开始AI分析帖子，ID: ${post.redditId}`);
    
    // 生成AI分析提示
    const prompt = promptAiAnalyzeQuery(
      post.title ?? '',
      post.selftext ?? '',
      post.query ?? ''
    );

    // 调用AI服务进行分析
    const analysisResult = await openaiService.generateText('ai-analyze-post', prompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      userId: post.userId,
    });

    if (!analysisResult) {
      return null;
    }

    logger.info(`AI分析完成，帖子ID: ${post.redditId}`);
    return analysisResult;

  } catch (error) {
    logger.error(`AI分析过程中发生错误，帖子ID: ${post.redditId}`, error);
    return null;
  }
}


/**
 * 处理单个帖子的完整流程
 * @param post 帖子数据
 * @returns 处理结果（成功返回帖子ID，失败返回null）
 */
async function processSinglePost(post: UnanalyzedPostData): Promise<string | null> {
  try {
    // 1. AI分析
    const analysisResult = await analyzePostWithAI(post);
    if (!analysisResult) {
      return null;
    }

    // 2. 解析和验证结果
    const parsedResult = parseAndValidateAIResult(analysisResult, post.redditId);
    if (!parsedResult) {
      return null;
    }

    // 3. 保存结果到数据库
    const saveSuccess = await saveAnalysisResult(post, parsedResult);
    if (!saveSuccess) {
      return null;
    }

    return post.redditId;

  } catch (error) {
    logger.error(`处理帖子时发生错误，ID: ${post.redditId}`, error);
    return null;
  }
}

/**
 * 批量处理帖子
 * @param posts 帖子数组
 * @param batchSize 批次大小
 * @returns 处理结果统计
 */
async function processBatchPosts(posts: UnanalyzedPostData[], batchSize: number = 10): Promise<{
  processed: number;
  total: number;
}> {
  let processedCount = 0;

  // 分批处理帖子
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    logger.info(`处理第 ${batchNumber} 批，共 ${batch.length} 条帖子`);

    // 并行处理当前批次的帖子
    const batchPromises = batch.map(post => processSinglePost(post));

    // 等待当前批次完成
    const batchResults = await Promise.allSettled(batchPromises);
    const successfulResults = batchResults
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .length;

    processedCount += successfulResults;
    
    logger.info(`第 ${batchNumber} 批处理完成，成功: ${successfulResults}/${batch.length}`);

    // 批次间稍作延迟，避免API限流
    if (i + batchSize < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    processed: processedCount,
    total: posts.length
  };
}

