import { db, RedditPost } from "@repo/database";
import { logger } from "@repo/logs";
import { config } from "@repo/config";
import { BUSINESS, openaiService, formatPrompt } from "@repo/ai";

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
interface AIAnalyzeRecord {
  userId: string;
  redditId: string;
  categoryId: string | null;
  confidence: number;
  result: {
    confidence: number;
    relation: string;
    reason: string;
  };
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
select * from  (
      SELECT 
      rp."redditId", 
      rp.title, 
      rp.selftext, 
      rp."categoryId", 
      ca.path, 
      aset."userId", 
      aset.query, 
      aset.subreddit,
      aset.subreddit ~ rp.subreddit as include
    FROM reddit_post rp       
    cross JOIN  agent_setting aset 
    LEFT JOIN  ai_analyze_record aar 
    on rp."redditId" = aar.reddit_id AND aar."userId" =aset."userId" 
       LEFT JOIN category ca 
      on ca.id =rp."categoryId"
    where aar."userId"  is null  and rp.selftext is not null and rp.selftext <> '' 
) as abc 
where include = true
order by abc."redditId"`;
  return unanalyzedPosts;
}

export async function getNoAnalyzePost() {
  logger.info(`start to ai analyze post=============================`);
  try {
    // 1. 获取未分析的帖子
	const aiAnalyze = config.aiAnalyze?.enabled
	if (!aiAnalyze) {
		logger.info(`ai analyze is disabled`);
		return;
	}
    const unanalyzedPosts = await fetchUnanalyzedPosts();
    logger.info(`找到 ${unanalyzedPosts.length} 条未分析的帖子`);

    if (unanalyzedPosts.length === 0) {
      return;
    }

    // 2. 批量处理帖子
    const batchSize = 30;
	const totalPosts = unanalyzedPosts.length;
    const result = await processBatchPosts(unanalyzedPosts, batchSize,totalPosts);

    return {
      success: true,
      processed: result.processed,
      total: result.total,
      message: `成功分析 ${result.processed} 条帖子`
    };

  } catch (error) {
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
 * @param records AI分析记录数组
 * @returns 是否保存成功
 */
async function saveAnalysisResult(records: AIAnalyzeRecord[]): Promise<boolean> {
  try {
    if (records.length === 0) {
      return true;
    }
    
    await db.aiAnalyzeRecord.createMany({
      data: records,
      skipDuplicates: true // 跳过重复记录，避免唯一约束冲突
    });
    
    return true;
  } catch (error) {
    logger.error('批量保存分析结果失败:', error);
    return false;
  }
}


/**
 * 对单个帖子进行AI分析
 * @param post 帖子数据
 * @returns AI分析结果字符串或null（如果失败）
 */
async function analyzePostWithAI(post: UnanalyzedPostData): Promise<AIAnalysisResult | null> {
  try {
    const settingPrompt = await db.aiPrompt.findFirst({
      select: {
        prompt: true,
      },
      where: {
        business: BUSINESS.REDDIT_POST_ANALYZE,
      },
    });

    if (!settingPrompt || !settingPrompt?.prompt) {
      logger.error("Reddit post analyze prompt not found");
      return null;
    }

    const prompt = formatPrompt(settingPrompt.prompt, {
      post_title: post.title ?? '',
      post_selftext: post.selftext ?? '',
      agent_setting_query: post.query ?? '',
    });

    // 调用AI服务进行分析
    const analysisResult = await openaiService.generateText(BUSINESS.REDDIT_POST_ANALYZE, prompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      userId: post.userId,
    });

    if (!analysisResult) {
      return null;
    }
	const result = parseAndValidateAIResult(analysisResult, post.redditId);
    return result;

  } catch (error) {  
    return null;
  }
}


/**
 * 批量处理帖子
 * @param posts 帖子数组
 * @param batchSize 批次大小
 * @returns 处理结果统计
 */
async function processBatchPosts(posts: UnanalyzedPostData[], batchSize: number = 10,totalPosts: number): Promise<{ processed: number;total: number;}> {
	let processedCount = 0;

  // 分批处理帖子
  const totalBatches = Math.ceil(posts.length / batchSize);
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    logger.info(`处理第 ${batchNumber} / ${totalBatches} 批`);
	
    // 处理当前批次的帖子
    const batchPromises = batch.map(async (post) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const analysisResult = await analyzePostWithAI(post);
      if (analysisResult) {
        return {
          post,
          analysisResult
        };
      }
      return null;
    });

    // 等待当前批次完成
    const batchResults = await Promise.allSettled(batchPromises);
    
    // 收集成功的分析结果
    const successfulResults = batchResults
      .filter((result): result is PromiseFulfilledResult<{post: UnanalyzedPostData, analysisResult: AIAnalysisResult}> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    // 将成功的结果转换为数据库记录格式
    const batchRecords: AIAnalyzeRecord[] = successfulResults.map(({ post, analysisResult }) => ({
      userId: post.userId,
      redditId: post.redditId,
      categoryId: post.categoryId,
      confidence: analysisResult.confidence,
      result: {
        confidence: analysisResult.confidence,
        relation: analysisResult.relation,
        reason: analysisResult.reason
      }
    }));

    processedCount += successfulResults.length;
    
    logger.info(`第 ${batchNumber} 批处理完成，成功: ${successfulResults.length}/${batch.length}`);
	  // 批量保存所有成功的分析结果
	if (batchRecords.length > 0) {
		const saveSuccess = await saveAnalysisResult(batchRecords);
		if (!saveSuccess) {
		  throw new Error('批量保存分析结果失败');
		}
	}
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

