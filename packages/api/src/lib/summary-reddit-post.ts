import { db } from "@repo/database";
import { logger } from "@repo/logs";
import { aiServiceManager, BUSINESS, formatPrompt } from "@repo/ai";


export async function summaryRedditPost() {
  logger.info("=====summaryRedditPost running=====");
  
  const unSummarizedPosts = await db.$queryRaw<{id: string,redditId: string,title: string,selftext: string}[]>`
      select id,"redditId",title,selftext from reddit_post rp where "createdUtc" > (now() - interval '3 days') and "aiSummary" is null and "redditId" in (
        select distinct reddit_id from ai_analyze_record aar where confidence > 0.6
      )`;

    logger.info(`summaryRedditPost unSummarizedPosts ${unSummarizedPosts.length} `);

    if (unSummarizedPosts.length === 0) {
      logger.info(`summaryRedditPost no unSummarizedPosts`);
      return;
    }

  const aiPrompt = await db.aiPrompt.findFirst({
    select: {
      prompt: true,
      model: true,
    },
    where: {
      business: BUSINESS.REDDIT_POST_SUMMARY,
    },
  });

  if (!aiPrompt || !aiPrompt?.prompt) {
    logger.error(`AI prompt not found for business ${BUSINESS.REDDIT_POST_SUMMARY}`);
    return;
  }

  // 对每个未总结的帖子进行总结
  for (const post of unSummarizedPosts) {
    if (!post.title || !post.selftext) {
      logger.error(`Post ${post.redditId} missing title or selftext`);
      continue;
    }
    try {
      const prompt = formatPrompt(aiPrompt.prompt, {
            post_title: post.title ?? '',
            post_selftext: post.selftext ?? '',
      });

      const analysisResult = await aiServiceManager.generateText(BUSINESS.REDDIT_POST_SUMMARY, prompt, {
        model: aiPrompt.model,
        temperature: 0.7,
      });
        // 更新数据库中的总结
      await db.redditPost.update({
        where: { id: post.id },
        data: { aiSummary: analysisResult },
      });
    } catch (error) {
      logger.error(`Error summarizing post ${post.redditId}: ${error}`);
      continue;
    }
  }
  
}


