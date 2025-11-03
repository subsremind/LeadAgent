import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { validator } from "hono-openapi/zod";
import { z } from "zod";
import { db } from "@repo/database";

import { authMiddleware } from "../../middleware/auth";
import { aiServiceManager, BUSINESS, formatPrompt } from "@repo/ai";

export const draftRouterRouter = new Hono()
	.basePath("/draft")
	.use(authMiddleware)
	.post(
		"/generate",
		// validator(
		// 	"json",
		// 	z.object({
		// 		customPrompt: z.string().optional(),
		// 	}),
		// ),
		describeRoute({
			summary: "Generate draft using prompt",
			tags: ["LeadAgent"],
		}),
		async (c) => {
			// const { customPrompt } = c.req.valid("json");
			const user = c.get("user");
			// const draftPrompt = promptDraftGenerate(customPrompt ?? '');

			const draftPrompt = await db.aiPrompt.findFirst({
				select: {
					prompt: true,
					model: true,
				},
				where: {
					business: BUSINESS.DRAFT_GENERATE,
				},
			});

			if (!draftPrompt || !draftPrompt?.prompt) {
				return c.json({ error: "Draft prompt not found" }, 404);
			}

			const agentSetting = await db.agentSetting.findUnique({
				where: { userId: user.id },
			});


			if (!agentSetting) {
				return c.json({ error: "AgentSetting not found" }, 404);
			}

			const prompt = formatPrompt(draftPrompt.prompt, {
				agent_setting_description: agentSetting.description ?? '',
			});

			console.log("draftPrompt", prompt);

			// return c.json([]);

			const analysisResult = await aiServiceManager.generateText(BUSINESS.DRAFT_GENERATE, prompt, {
				model: draftPrompt.model,
				temperature: 0.7,
				userId: user.id,
			  });
			try {
				// 如果有 ```json， 处理
				if (analysisResult) {
					const jsonMatch = analysisResult.match(/```json([\s\S]*?)```/);
					if (jsonMatch) {
						const jsonStr = jsonMatch[1].trim();
						const draftList = JSON.parse(jsonStr);
						return c.json(draftList);
					}
					const draftList = JSON.parse(analysisResult);
					return c.json(draftList);
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
			}
			return c.json([]);

			// return c.json([
			// 	{
			// 		"title": "Streamlining Multi-Channel Chaos: Elevate Your Marketing with AI-Powered Lead Integration",
			// 		"content": "In today’s hyper-connected digital landscape, marketing teams are no longer limited to a single touchpoint—they’re leveraging social media, email campaigns, website forms, offline events, third-party marketplaces, and even chatbots to reach potential customers. While this multi-channel strategy expands your brand’s reach and boosts lead generation, it often creates a messy, fragmented workflow that drains time, wastes resources, and puts valuable opportunities at risk.​Are you tired of juggling leads scattered across a dozen platforms? Picture this: You spend hours switching between Instagram DMs, LinkedIn messages, email inboxes, event registration spreadsheets, and website contact forms—just to collect basic customer info. When you finally compile these leads, you’re faced with inconsistent data: some entries lack phone numbers, others have typos in company names, and duplicate leads slip through the cracks (how many times have you followed up with the same prospect twice, accidentally?). Worst of all, this disorganization means your sales team never gets a complete, real-time view of each lead. A prospect who inquired via your website might also engage with your Facebook ad—but without unified data, your team misses that context, leading to delayed follow-ups, generic pitches, and lost conversions.​Enough of letting multi-channel chaos hold back your growth. Our AI-powered Lead Integration Platform is designed to turn this disarray into streamlined efficiency. Here’s how it works:​First, the AI acts as your 24/7 “lead aggregator,” seamlessly connecting to every marketing channel you use—from social media (Facebook, Instagram, LinkedIn, TikTok) and email marketing tools (Mailchimp, HubSpot) to website forms, event check-in apps, and even chatbots like Intercom. It automatically captures leads in real time, so you never miss a new inquiry, even when your team is offline.​Next, it cleans and standardizes the data. The AI uses advanced algorithms to fix inconsistencies: it fills in missing fields (e.g., appending a prospect’s company name if only their email is provided), corrects typos, and eliminates duplicates by cross-referencing data points like email addresses or phone numbers. It also tags leads with relevant labels—such as “interested in SaaS tools,” “attended Q3 webinar,” or “came from Google Ads”—so you can segment your audience effortlessly.​Finally, it unifies everything in a single, user-friendly dashboard. No more logging into 10 different tools: your marketing and sales teams can access every lead’s full profile—including their source, interaction history, preferences, and past communications—in one place. This isn’t just about convenience; it’s about empowering your team to act fast and smarter.​But the real game-changer? Consistent, personalized follow-ups. With unified lead data, the AI doesn’t just organize information—it guides action. It sends automated reminders to your sales team when a lead is ready to be contacted (e.g., “Follow up with Sarah from XYZ Corp—she downloaded the pricing guide 2 hours ago”). It even suggests tailored follow-up scripts based on the lead’s behavior: a prospect who asked about customer support gets a message focused on your service team, while someone who viewed your product demo gets a pitch highlighting key features they showed interest in. The result? Faster response times, more relevant conversations, and a huge boost in conversion rates.​Say goodbye to spreadsheets, missed leads, and inconsistent outreach. Our AI doesn’t just streamline your workflow—it transforms how you connect with prospects, turning multi-channel chaos into a competitive advantage.​Ready to see how AI can elevate your lead management and boost sales efficiency? Explore our platform, watch a demo, or talk to our team to learn more: [link]​#LeadIntegration #SalesEfficiency #AIMarketing #MultiChannelSuccess",
			// 		"channel": "CompanyCulture"
			// 	},
			// 	{
			// 		"title": "24/7 Lead Coverage—Never Miss a Beat",
			// 		"content": "Say goodbye to missed leads! Our AI platform provides 24/7 coverage, ensuring you capture every opportunity. 📈 #LeadManagement #AlwaysOn Try it now!",
			// 		"channel": "Sales"
			// 	},
			// 	{
			// 		"title": "Streamlining Multi-Channel Chaos",
			// 		"content": "Tired of juggling leads from different platforms? Our AI unifies them for consistent follow-ups. #LeadIntegration #SalesEfficiency Explore more: [link]",
			// 		"channel": "Marketing"
			// 	},
			// 	{
			// 		"title": "LeadAgent's Commitment to SMBs",
			// 		"content": "We empower SMBs with affordable AI tools—saving time and resources. Join our mission to streamline your sales! #SMBSupport #EfficientSales Retweet to spread the word!",
			// 		"channel": "CompanyCulture"
			// 	}
			// ])

			
		},
	);
	
