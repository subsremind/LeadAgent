import { db, RedditPost } from "@repo/database";
import { logger } from "@repo/logs";
import { config } from "@repo/config";
import { nanoid } from "nanoid";

// 从数据库获取Reddit token
export async function getRedditTokenFromDB(): Promise<{accessToken: string, refreshToken?: string, expiresAt?: string} | null> {
	try {
		const tokenRecord = await db.integrationAuth.findFirst({
			where: {
				type: 'reddit'
			},
			orderBy: {
				createdAt: 'desc'
			}
		});
		
		if (!tokenRecord) {
			return null;
		}
		
		return {
			accessToken: tokenRecord.accessToken || '',
			refreshToken: tokenRecord.refreshToken || undefined,
			expiresAt: tokenRecord.expiresAt || undefined
		};
	} catch (error) {
		logger.error('Failed to get Reddit token from database:', error);
		return null;
	}
}

// 刷新Reddit token
export async function refreshRedditToken(refreshToken: string): Promise<{access_token: string, expires_in: number, refresh_token?: string}> {
	const redditClientId = process.env.REDDIT_CLIENT_ID || "z_9PVcqKjjJKMFpXBhdzGw";
	const redditClientSecret = process.env.REDDIT_CLIENT_SECRET || "3oLGLdeoCGEMP2RwMSQUztLxFSK7RA";

	if (!redditClientId || !redditClientSecret) {
		throw new Error('Reddit API credentials missing');
	}

	logger.info('Refreshing Reddit access token...');

	const res: Response = await fetch('https://www.reddit.com/api/v1/access_token', {
		method: 'POST',
		headers: {
			'User-Agent': 'lead_agent_Oauth2/1.0',
			'Authorization': 'Basic ' + btoa(`${redditClientId}:${redditClientSecret}`),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
	});

	if (!res.ok) {
		const errorText = await res.text();
		logger.error('Failed to refresh token:', errorText);
		throw new Error(`Failed to refresh Reddit token: ${res.status} - ${errorText}`);
	}

	const tokenData = await res.json();
	
	// 更新数据库中的token
	await updateRedditTokenInDB(tokenData);
	
	return tokenData;
}

// 更新数据库中的Reddit token
export async function updateRedditTokenInDB(tokenData: any): Promise<void> {
	try {
		await db.integrationAuth.updateMany({
			where: {
				type: 'reddit'
			},
			data: {
				accessToken: tokenData.access_token,
				refreshToken: tokenData.refresh_token || undefined,
				expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : undefined,
				updatedAt: new Date()
			}
		});
		logger.info('Reddit token updated in integrationAuth table successfully');
	} catch (error) {
		logger.error('Failed to update Reddit token in integrationAuth table:', error);
		throw error;
	}
}

// 使用授权码交换访问令牌
export async function exchangeCodeForToken(authorizationCode: string): Promise<{access_token: string, expires_in: number, refresh_token?: string}> {
	const redditClientId = process.env.REDDIT_CLIENT_ID;
	const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
	// 不做国际化处理，直接使用 /callback
	const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`;

	if (!redditClientId || !redditClientSecret) {
		logger.error('Reddit API credentials not configured in environment variables');
		logger.error('Missing credentials:', {
			hasClientId: !!redditClientId,
			hasClientSecret: !!redditClientSecret
		});
		throw new Error('Reddit API credentials missing');
	}

	logger.info('Exchanging authorization code for access token...');
	logger.info('Using redirect URI:', redirectUri);

	const res: Response = await fetch('https://www.reddit.com/api/v1/access_token', {
		method: 'POST',
		headers: {
			'User-Agent': 'lead_agent_Oauth2/1.0',
			'Authorization': 'Basic ' + btoa(`${redditClientId}:${redditClientSecret}`),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: `grant_type=authorization_code&code=${encodeURIComponent(authorizationCode)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
	});

	logger.info(`Reddit token response status: ${res.status} ${res.statusText}`);
	
	if (!res.ok) {
		const errorText = await res.text();
		logger.error('Failed to exchange code for token:', errorText);
		throw new Error(`Failed to get Reddit token: ${res.status} - ${errorText}`);
	}

	const tokenData = await res.json();
	return tokenData;
}

// 保存Reddit token到数据库
export async function saveRedditToken(tokenData: any): Promise<void> {
	try {
		// 先删除现有的Reddit token记录
		await db.integrationAuth.deleteMany({
			where: {
				type: 'reddit'
			}
		});

		// 创建新的token记录
		await db.integrationAuth.create({
			data: {
				id: nanoid(),
				accessToken: tokenData.access_token,
				refreshToken: tokenData.refresh_token || null,
				tokenType: tokenData.token_type || 'bearer',
				expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
				scope: tokenData.scope || 'read',
				type: 'reddit',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		});
		logger.info('Reddit token saved to integrationAuth table successfully');
	} catch (error) {
		logger.error('Failed to save Reddit token to integrationAuth table:', error);
		throw error;
	}
}

export async function getRedditPost() {
	try {
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
		logger.info(`sync-posts channelList size: ${channelList.length}`);
		const limitPerChannel = 300; // 每个 channel 同步 x 条数据 process.env.REDDIT_LIMIT_PER_CHANNEL ||
		const redditIdList: string[] = []
		let posts: RedditPost[] = []
		for (const channel of channelList) {
			try {
				logger.info(`sync-posts start fetchRedditPosts channel: ${channel.path}`);
				const channelPosts = await fetchRedditPosts(channel, sortType, limitPerChannel);
				logger.info(`sync-posts end fetchRedditPosts channel: ${channel.path} posts size: ${channelPosts.length}`);
				for (const post of channelPosts) {
						redditIdList.push(post.redditId);
						posts.push(post);
				}
			} catch (error) {
				logger.error(`Failed to fetch posts for channel ${channel.path}:`, error);
			}
		}
		logger.info(`sync-posts total posts size: ${posts.length}`);
		const dbRecords = await db.redditPost.findMany({
			select: {
			  redditId: true
			},
			where: {
				redditId: {
				in: redditIdList
				}
			}
		  });
		logger.info(`sync-posts post list size: ${redditIdList.length} `);
		// 从 posts 中移除已存在于 dbRecords 中的 redditId
		const dbRedditIds = dbRecords.map((record: { redditId: string }) => record.redditId);
		logger.info(`sync-posts db list size: ${dbRedditIds.length} `);
		const filteredPosts = posts.filter(post => !dbRedditIds.includes(post.redditId));	
		logger.info(`sync-posts save list size: ${filteredPosts.length} `);
		if(filteredPosts.length>0){
			logger.info(`sync-posts start saveBatchRedditPosts`);
			await saveBatchRedditPosts(filteredPosts);
			logger.info(`sync-posts end saveBatchRedditPosts`);
		}

	} catch (error) {
		logger.error(`Failed to sync posts:`, error);
		throw error;
	}
}

// 全局变量存储访问令牌和过期时间
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function fetchRedditPosts(channel: { id: string; path: string }, sortType: string, limit = 1) {
	const subreddit = channel.path;
	const allPosts: RedditPost[] = [];
	let after: string | null = null;
	let remainingLimit = limit;
	
	// 获取有效的访问令牌
	let accessToken = await getValidAccessToken();
	logger.info(`sync-post fetchRedditPosts subreddit: ${subreddit} accessToken: ${accessToken} limit: ${remainingLimit}`);
	while (remainingLimit > 0) {
		// 随机延迟 1-3 秒
		const delay = Math.floor(Math.random() * 2000) + 1000; // 1000-3000ms
		await new Promise(resolve => setTimeout(resolve, delay));
		const batchSize = Math.min(remainingLimit, 100);
		const url: string = `https://oauth.reddit.com/${subreddit}/${sortType}.json?t=all&limit=${batchSize}${after ? `&after=${after}` : ''}`;
		
		try {
			const res: Response = await fetch(url, {
				headers: { 
					"User-Agent": "reddit-get-post-script",
					"Authorization": `Bearer ${accessToken}`
				},
				// 添加超时和重试配置
				signal: AbortSignal.timeout(30000), // 30秒超时
			});

			// 检查响应状态
			if (!res.ok) {
				logger.error(`Reddit API request failed with status ${res.status}: ${res.statusText}`);
				
				// 如果是认证错误，尝试刷新token
				if (res.status === 401) {
					logger.info('Access token expired, attempting to refresh...');
					try {
						accessToken = await getValidAccessToken();
						continue; // 重试当前请求
					} catch (refreshError) {
						logger.error('Failed to refresh access token:', refreshError);
						break;
					}
				}
				break;
			} else  {
				logger.error(`sync-post Rate limit hit for: ${url}`);
			}

			// 检查响应内容类型
			const contentType = res.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				logger.error(`Unexpected content type: ${contentType}`);
				const text = await res.text();
				logger.error(`Response body: ${text.substring(0, 500)}`);
				break;
			}

			// 获取响应文本并检查是否为空
			const responseText = await res.text();
			if (!responseText || responseText.trim() === '') {
				logger.error('Empty response body from Reddit API');
				break;
			}

			// 尝试解析 JSON
			let json;
			try {
				json = JSON.parse(responseText);
			} catch (parseError) {
				logger.error('Failed to parse JSON response:', parseError);
				logger.error(`Response text: ${responseText.substring(0, 500)}`);
				break;
			}

			const posts = extractPosts(json, channel.id);
			if (posts.length === 0) {
				break;
			}				
			allPosts.push(...posts);
			remainingLimit -= posts.length;
			after = json.data?.after;
			if (!after) {
				break;
			}
		} catch (error) {
			logger.error('sync-post Error fetching Reddit posts:', error);
			
			// 检查是否是网络连接错误
			if (error instanceof Error) {
				if (error.message.includes('ECONNRESET') || error.message.includes('fetch failed')) {
					logger.warn('Network connection error, retrying after delay...');
					// 网络错误时等待更长时间再重试
					await new Promise(resolve => setTimeout(resolve, 5000));
					continue;
				}
				
				if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
					logger.warn('Request timeout, retrying...');
					continue;
				}
			}
			
			// 其他错误直接退出
			break;
		}
	}
	
	logger.info(`fetch ${allPosts.length} posts from ${subreddit}`);
	return allPosts;
}

// 获取有效的访问令牌（从数据库读取）
// 存储授权码和状态参数的全局变量
let storedAuthorizationCode: string | null = null;
let storedState: string | null = null;

// 设置授权码（从回调中获取，包含状态验证）
export function setRedditAuthorizationCode(code: string, state?: string): void {
	// 验证状态参数
	if (state && storedState && state !== storedState) {
		logger.error('State parameter mismatch - possible CSRF attack');
		throw new Error('Invalid state parameter');
	}
	
	storedAuthorizationCode = code;
	logger.info('Reddit authorization code has been set and state verified');
	
	// 清除已使用的状态参数
	storedState = null;
}

// 获取授权URL（供外部调用）
export const getRedditAuthUrl = async (): Promise<string> => {
	return generateRedditAuthUrl();
}

async function getValidAccessToken(): Promise<string> {
	// 首先尝试从数据库获取token
	const tokenFromDB = await getRedditTokenFromDB();
	
	if (tokenFromDB?.accessToken) {
		// 检查token是否过期
		if (tokenFromDB.expiresAt) {
			const expiresAt = new Date(tokenFromDB.expiresAt).getTime();
			const now = Date.now();
			
			// 如果token未过期，直接返回
			if (now < expiresAt) {
				return tokenFromDB.accessToken;
			}
			
			// 如果token过期但有refresh token，尝试刷新
			if (tokenFromDB.refreshToken) {
				try {
					const refreshedToken = await refreshRedditToken(tokenFromDB.refreshToken);
					return refreshedToken.access_token;
				} catch (error) {
					logger.error('Failed to refresh token:', error);
				}
			}
		} else {
			// 如果没有过期时间信息，直接返回token
			return tokenFromDB.accessToken;
		}
	}
	
	// 如果没有有效的token，需要重新授权
	if (!storedAuthorizationCode) {
		const authUrl = generateRedditAuthUrl();
		throw new Error(`Reddit authorization required. Please visit: ${authUrl} and then call setRedditAuthorizationCode() with the received code.`);
	}
	
	// 使用授权码获取新的访问令牌
	logger.info('Fetching new Reddit access token using authorization code...');
	const tokenData ="" // await getRedditToken(storedAuthorizationCode);
	
	return tokenData;
}

async function saveBatchRedditPosts(
	rows: RedditPost[],
	batchSize = 50
  ): Promise<number> {
	if (!rows.length) return 0;

	logger.info(`sync post save batch ${rows.length}, batchSize: ${batchSize}`);
	if (rows.length <= batchSize) {
		const createMany = await db.redditPost.createMany({
			data: rows,
		});
		return createMany.count;
	}
	let inserted = 0;
	for (let i = 0; i < rows.length; i += batchSize) {
		const chunk = rows.slice(i, i + batchSize);
		const createMany = await db.redditPost.createMany({
			data: chunk,
		});
		inserted += createMany.count;
	}
  
	// let inserted = 0;
	// for (let i = 0; i < rows.length; i += batchSize) {
	//   const chunk = rows.slice(i, i + batchSize);
	//   const valuesSql: string[] = [];
	//   const valuesArg: any[]    = [];
	//   let cursor = 1;
  
	//   for (const r of chunk) {
	// 	valuesSql.push(`(
	// 		$${cursor},$${cursor+1},$${cursor+2},$${cursor+3},$${cursor+4},$${cursor+5},$${cursor+6},
	// 		$${cursor+7}::int,$${cursor+8}::int,$${cursor+9}::int,$${cursor+10}::int,
	// 		$${cursor+11}::timestamp ,
	// 		$${cursor+12},$${cursor+13}::vector,
	// 		NOW(),NOW(),$${cursor+14}
	// 	  )`);
	// 	// 生成默认的1536维零向量，或者使用 OpenAI embedding
	// 	//let embeddingStr: string;
	// 	// try {
	// 	// 	// 尝试生成真实的 embedding
	// 	// 	const embedding = await openaiService.generateEmbedding('reddit-embedding', '', `${r.title} ${r.selftext ?? ""}`);
	// 	// 	embeddingStr = embedding.join(',');
	// 	// } catch (error) {
	// 	// 	// 如果 embedding 生成失败，使用默认的1536维零向量
	// 	// 	logger.warn('Failed to generate embedding, using default zero vector:', error);
	// 	// 	embeddingStr = new Array(1536).fill(0).join(',');
	// 	// }
		
	// 	valuesArg.push(
	// 		r.redditId,
	// 		r.title,
	// 		r.selftext ?? null,
	// 		r.url ?? null,
	// 		r.permalink ?? null,
	// 		r.author ?? null,
	// 		r.subreddit ?? null,
	// 		r.ups ?? 0,
	// 		r.downs ?? 0,
	// 		r.score ?? 0,
	// 		r.numComments ?? 0,
	// 		r.createdUtc ?? null,
	// 		r.categoryId ?? null,
	// 		null, //embeddingStr.join(',')
	// 		nanoid()   // 最后一个对应 $15
	// 	  );
	// 	cursor += 15;
	//   }
  
	//   const stmt = `
	// 	INSERT INTO reddit_post (
	// 	  "redditId","title","selftext","url","permalink","author",
	// 	  "subreddit","ups","downs","score","numComments","createdUtc",
	// 	  "categoryId","embedding","recordCreatedAt","recordUpdatedAt","id"
	// 	) VALUES ${valuesSql.join(',')};
	//   `;
  
	//   const res: { '?column?': number }[] = await db.$queryRawUnsafe(stmt, ...valuesArg);
	//   inserted += res.length;
	// }
	return inserted;
  }

function extractPosts(json: any, categoryId?: string): RedditPost[] {
	return json.data.children.map((c: any) => {
	  const post = c.data;
	  const createdUtcTs = toUtcDate(post?.created_utc);
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

// 生成Reddit OAuth2授权URL
function generateRedditAuthUrl(): string {
	const redditClientId = process.env.REDDIT_CLIENT_ID || "z_9PVcqKjjJKMFpXBhdzGw";
	// 不做国际化处理，直接使用 /callback
	const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`;
	const state = nanoid(16); // 生成16位随机状态参数
	const scope = 'read'; // 请求读取权限
	
	if (!redditClientId) {
		logger.error('REDDIT_CLIENT_ID not configured in environment variables');
		throw new Error('Reddit client ID missing');
	}

	// 存储状态参数用于验证
	storedState = state;

	const authUrl = new URL('https://www.reddit.com/api/v1/authorize');
	authUrl.searchParams.set('client_id', redditClientId);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('state', state);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('duration', 'permanent');
	authUrl.searchParams.set('scope', scope);

	logger.info('Generated Reddit authorization URL with state parameter:', authUrl.toString());
	logger.info('Please visit this URL to authorize the application and get the authorization code');
	
	return authUrl.toString();
}

// 使用授权码交换访问令牌 (内部使用)
async function exchangeCodeForTokenInternal(authorizationCode: string): Promise<{access_token: string, expires_in: number, refresh_token?: string}> {
	const redditClientId = process.env.REDDIT_CLIENT_ID;
	const redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
	// 不做国际化处理，直接使用 /callback
	const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`;

	if (!redditClientId || !redditClientSecret) {
		logger.error('Reddit API credentials not configured in environment variables');
		logger.error('Missing credentials:', {
			hasClientId: !!redditClientId,
			hasClientSecret: !!redditClientSecret
		});
		throw new Error('Reddit API credentials missing');
	}

	logger.info('Exchanging authorization code for access token...');

	const res: Response = await fetch('https://www.reddit.com/api/v1/access_token', {
		method: 'POST',
		headers: {
			'User-Agent': 'lead_agent_Oauth2/1.0',
			'Authorization': 'Basic ' + btoa(`${redditClientId}:${redditClientSecret}`),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: `grant_type=authorization_code&code=${encodeURIComponent(authorizationCode)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
	});

	logger.info(`Reddit token response status: ${res.status} ${res.statusText}`);
	
	if (!res.ok) {
		const errorText = await res.text();
		logger.error('Failed to exchange code for token:', errorText);
		throw new Error(`Failed to get Reddit token: ${res.status} - ${errorText}`);
	}

	const tokenData = await res.json();
	// 保存 tokenData 结果到数据库
	await saveRedditToken(tokenData);
	
	return tokenData;
}

// 修改后的getRedditToken函数 - 现在需要授权码作为参数
async function getRedditToken(authorizationCode?: string) {
	if (!authorizationCode) {
		// 如果没有提供授权码，生成授权URL
		const authUrl = generateRedditAuthUrl();
		throw new Error(`Authorization required. Please visit: ${authUrl}`);
	}

	// 使用授权码交换访问令牌
	return await exchangeCodeForTokenInternal(authorizationCode);
}

