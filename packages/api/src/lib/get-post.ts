import { Category, db, RedditPost } from "@repo/database";
import { logger } from "@repo/logs";
import { config } from "@repo/config";
import { openaiService } from "@repo/ai";
import { nanoid } from "nanoid";


export async function getRedditPost() {
	try {
		logger.info(`start to sync post=============================`);
		const syncPost = config.syncPost.enabled
		if (!syncPost) {
			logger.info(`sync post is disabled`);
			return;
		}
		const sortType = "new";
		const channelList = await db.category.findMany({
			select: {
			  id: true,
			  path: true
			},
			where: {
			  platform: 'reddit'
			},
			distinct: ['path'],
			orderBy: [
			  { path: 'asc' },
			  { id: 'asc' }
			]
		  });
		const limitPerChannel = 1; // 每个 channel 同步 x 条数据 process.env.REDDIT_LIMIT_PER_CHANNEL ||
		const redditIdList: string[] = []
		let posts: RedditPost[] = []
		for (const channel of channelList) {
			
			try {
				posts = await fetchRedditPosts(channel, sortType, limitPerChannel);
				
				for (const post of posts) {
					try {
						redditIdList.push(post.id);


						
					} catch (error) {
					}
				}
			} catch (error) {
			}
		}
		
		const dbRecords = await db.redditPost.findMany({
			select: {
			  redditId: true
			},
			where: {
			  subreddit: {
				in: redditIdList
				}
			}
		  });
		// 从 posts 中移除已存在于 dbRecords 中的 redditId
		const dbRedditIds = dbRecords.map(record => record.redditId);
		const filteredPosts = posts.filter(post => !dbRedditIds.includes(post.id));
		logger.info(`save ${filteredPosts.length} posts to db`);
		await saveBatchRedditPosts(filteredPosts);

		// await savePostToDB(post, embedding, channel.id);
	} catch (error) {
		throw error;
	}
}

async function fetchRedditPosts(channel: Category, sortType: string, limit = 1) {
	const subreddit = channel.path;
	const allPosts: RedditPost[] = [];
	let after: string | null = null;
	let remainingLimit = limit;
	
	while (remainingLimit > 0) {
		await new Promise(resolve => setTimeout(resolve, 2000));
		const batchSize = Math.min(remainingLimit, 100);
		const url: string = `https://www.reddit.com/${subreddit}/${sortType}.json?t=all&limit=${batchSize}${after ? `&after=${after}` : ''}`;
		// const url: string = `https://www.reddit.com/${subreddit}/${sortType}.json?t=all&limit=${batchSize}`;
		try {
			const res: Response = await fetch(url, {
				headers: { "User-Agent": "reddit-embeddings-script" },
			});			
			if (!res.ok) {
				break;
			}			
			const json = await res.json();
			const posts = extractPosts(json, channel.id);
			
			if (posts.length === 0) {
				logger.error(`no posts found from ${subreddit}`);
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
	logger.info(`fetch ${allPosts.length} posts from ${subreddit}`);
	return allPosts;
}



async function saveBatchRedditPosts(
	rows: RedditPost[],
	batchSize = 500
  ): Promise<number> {
	if (!rows.length) return 0;
  
	let inserted = 0;
	for (let i = 0; i < rows.length; i += batchSize) {
	  const chunk = rows.slice(i, i + batchSize);
	  const valuesSql: string[] = [];
	  const valuesArg: any[]    = [];
	  let cursor = 1;
  
	  for (const r of chunk) {
		valuesSql.push(`(
			$${cursor},$${cursor+1},$${cursor+2},$${cursor+3},$${cursor+4},$${cursor+5},$${cursor+6},
			$${cursor+7}::int,$${cursor+8}::int,$${cursor+9}::int,$${cursor+10}::int,
			$${cursor+11}::timestamp ,
			$${cursor+12},$${cursor+13}::vector,
			NOW(),NOW(),$${cursor+14}
		  )`);
		const embeddingStr = await openaiService.generateEmbedding('reddit-embedding','', `${r.title} + ${r.selftext ?? ""}`);	
		valuesArg.push(
			r.redditId,
			r.title,
			r.selftext ?? null,
			r.url ?? null,
			r.permalink ?? null,
			r.author ?? null,
			r.subreddit ?? null,
			r.ups ?? 0,
			r.downs ?? 0,
			r.score ?? 0,
			r.numComments ?? 0,
			r.createdUtc ?? null,
			r.categoryId ?? null,
			`[${embeddingStr.join(',')}]`,
			nanoid()   // 最后一个对应 $15
		  );
		cursor += 15;
	  }
  
	  const stmt = `
		INSERT INTO reddit_post (
		  "redditId","title","selftext","url","permalink","author",
		  "subreddit","ups","downs","score","numComments","createdUtc",
		  "categoryId","embedding","recordCreatedAt","recordUpdatedAt","id"
		) VALUES ${valuesSql.join(',')};
	  `;
  
	  const res: { '?column?': number }[] = await db.$queryRawUnsafe(stmt, ...valuesArg);
	  inserted += res.length;
	}
	return inserted;
  }

function extractPosts(json: any, categoryId?: string): RedditPost[] {
	return json.data.children.map((c: any) => {
	  const post = c.data;
	  logger.info(`=============extract post: `, post);
	  const createdUtcTs = toUtcDate(post?.created_utc);
		logger.info(`=============createdUtcTs: `, createdUtcTs);
	  const redditPost: RedditPost = {
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
		createdUtc: createdUtcTs,
		categoryId: categoryId || null,
		id: nanoid(),
		recordCreatedAt: new Date(),
		recordUpdatedAt: new Date(),
	  };
		return redditPost;
	});
  }

  export function toUtcDate(ts: string | number | null | undefined): Date | null {
	if (ts == null) return null;
	const n = Number(ts);
	if (Number.isNaN(n)) return null;
	// 10 位秒 → 13 位毫秒
	const ms = n < 1e11 ? n * 1000 : n;
	return new Date(ms);
  }

