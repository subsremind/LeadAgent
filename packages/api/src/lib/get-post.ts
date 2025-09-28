import { db } from "@repo/database";
import { redditPost,category } from "@repo/database/drizzle/schema";
import { logger } from "@repo/logs";
import { OpenAI } from "openai";
import { config } from "@repo/config";
import { eq, inArray } from "drizzle-orm";
import { encode, decode } from "gpt-tokenizer";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY || "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",
});
const MAX_TOKENS = 8191;


export async function getRedditPost() {
	try {
		const sortType = "new";
		const channelList = await db
			.selectDistinctOn([category.path], {
			id: category.id,
			path: category.path,
			})
			.from(category)
			.where(eq(category.platform, "reddit"))
			.orderBy(category.path, category.id);
		const limitPerChannel = 500; // 每个 channel 同步 x 条数据 process.env.REDDIT_LIMIT_PER_CHANNEL ||
		for (const channel of channelList) {
			const subreddit = channel.path;
			
			try {
				const posts = await fetchRedditPosts(subreddit, sortType, limitPerChannel);
				
				const postIds = posts.map(post => post.id);
				const existingPosts = await db
					.select({ redditId: redditPost.redditId })
					.from(redditPost)
					.where(inArray(redditPost.redditId, postIds));
				
				const existingPostIds = new Set(existingPosts.map(p => p.redditId));

				const newPostsData: any[] = [];
				
				for (const post of posts) {
					try {
						// 跳过已存在的帖子
						if (existingPostIds.has(post.id)) {
							continue;
						}
						
						const text = `${post.title}, ${post.selftext ?? ""}`;
						const tokenCount = countTokens(text);						
						if (tokenCount > MAX_TOKENS) {
							continue;
						}
						
						const embedding = await generateEmbedding(text);
						
						const createdUtcTs = post?.created_utc != null
							? new Date(Math.round(Number(post.created_utc) * 1000))
							: null;

						newPostsData.push({
							redditId: post.id,
							title: post.title,
							selftext: post.selftext ?? "",
							url: post.url,
							permalink: post.permalink,
							author: post.author,
							subreddit: post.subreddit,
							ups: post.ups,
							downs: post.downs,
							score: post.score,
							numComments: post.num_comments,
							createdUtc: createdUtcTs as any,
							embedding: embedding,
							categoryId: channel.id || null
						});
					} catch (error) {
					}
				}
				
				if (newPostsData.length > 0) {
					await batchInsertPosts(newPostsData);
				}
			} catch (error) {
			}
		}
	} catch (error) {
		throw error;
	}
}

async function fetchRedditPosts(subreddit: string, sortType: string, limit = 1) {
	const allPosts: RedditPost[] = [];
	let after: string | null = null;
	let remainingLimit = limit;
	
	while (remainingLimit > 0) {
		await new Promise(resolve => setTimeout(resolve, 2000));
		const batchSize = Math.min(remainingLimit, 100);
		const url: string = `https://www.reddit.com/${subreddit}/${sortType}.json?t=all&limit=${batchSize}${after ? `&after=${after}` : ''}`;
		try {
			const res: Response = await fetch(url, {
				headers: { "User-Agent": "reddit-embeddings-script" },
			});			
			if (!res.ok) {
				break;
			}			
			const json = await res.json();
			const posts = extractPosts(json);
			
			if (posts.length === 0) {
				break;
			}
			
			allPosts.push(...posts);
			remainingLimit -= posts.length;
			after = json.data.after;			
			if (!after) {
				break;
			}
		} catch (error) {
			break;
		}
	}
	return allPosts;
}

async function generateEmbedding(text: string) {
	try {
		// if (!process.env.OPENAI_API_KEY) {
		// 	throw new Error("OPENAI_API_KEY environment variable is not set");
		// }
		
		const response = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: text,
		});
		return response.data[0].embedding;
	} catch (error) {
		logger.error("Error generating embedding:", error);
		throw error;
	}
}

async function batchInsertPosts(postsData: any[]) {
	try {
		if (postsData.length === 0) {
			return;
		}
		await db.insert(redditPost).values(postsData).onConflictDoNothing({ target: redditPost.redditId });
		return true;
	} catch (error) {
		let successCount = 0;
		for (const postData of postsData) {
			try {
				await db.insert(redditPost).values(postData).onConflictDoNothing({ target: redditPost.redditId });
				successCount++;
			} catch (individualError) {
			}
		}
		
		if (successCount > 0) {
			logger.info(`Fallback: Successfully inserted ${successCount}/${postsData.length} posts individually`);
		}
		
		throw error;
	}
}

type RedditPost = {
	id: string;
	title: string;
	selftext: string;
	url: string;
	permalink: string;
	author: string;
	subreddit: string;
	ups: number;
	downs: number;
	score: number;
	num_comments: number;
	created_utc: number;
};

function extractPosts(json: any): RedditPost[] {
	return json.data.children.map((c: any) => {
	  const post = c.data;
	  return {
		id: post.id,
		title: post.title,
		selftext: post.selftext ?? "",
		url: post.url,
		permalink: post.permalink,
		author: post.author,
		subreddit: post.subreddit,
		ups: post.ups,
		downs: post.downs,
		score: post.score,
		num_comments: post.num_comments,
		created_utc: post.created_utc,
	  };
	});
  }

  function countTokens(text: string): number {
	return encode(text).length;
}
