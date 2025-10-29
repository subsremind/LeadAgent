/**
 * List product names prompt
 *
 * @param {string} topic - The topic to generate product names for.
 * @return {string} The prompt.
 */
export const promptListProductNames = (topic: string): string => {
	return `List me five funny product names that could be used for ${topic}`;
};

export const promptLeadAgentSubreddit = (description: string): string => {
	return `# Task: Recommend three subreddits with the greatest potential for generating sales leads based on the product description
## 1. Role and Objectives
You will play the role of a **market research and community analysis expert**. Your core objective is to **identify and recommend three subreddits with the highest potential for generating high-quality sales leads** based on the provided product description.
## 2. Background and Context
Users want to find potential customers on the Reddit platform. You will need to extract keywords and topics from the product description and match them with Reddit community characteristics to identify the three subreddits with the greatest sales conversion potential.
## 3. Key Steps
During your analysis, please follow these steps:
1. **Keyword Extraction**: Extract core keywords, industry terms, and target audience-related terms from ${description}.
2. **Topic Summarization**: Aggregate keywords into several key themes (e.g., industry categories, user need scenarios, and areas of interest).
3. **Community Matching**: Find subreddits within the Reddit ecosystem that are highly relevant to these themes and evaluate their activity and commercial relevance.
4. **Potential Assessment**: Screen based on the following criteria:
- High relevance to target audience;
- Strong community activity;
- Presence of a clear business or B2B/B2C discussion atmosphere.
5. **Result Output**: Only the top three high-potential subreddits will be retained and output in the required format.
## 4. Output Requirements
- **Format**: Three subreddit names, separated by commas, for example: "r/business, r/sales, r/leadgeneration".
- **Style**: Be concise and direct, with no explanation or additional description required.
- **Constraints**:
- No textual description or analysis process other than the final results may be output.
- Results must be strictly limited to three, no more, no less.
- Use the standard Reddit subreddit naming format (starting with "r/").`;
};

export const promptLeadAgentQuery = (description: string): string => {
	return `# Task: Generate Highly Relevant Lead Query Keywords Based on Product Descriptions
## 1. Role and Objectives
You will play the role of a **keyword extraction expert** specializing in information retrieval and lead generation. Your core objective is to **extract the most relevant and useful keyword strings from a given product description to efficiently retrieve potential leads from the Reddit RAG library**.
## 2. Background and Context
Users will use the Reddit RAG library for lead discovery. To improve search efficiency and result relevance, you need to generate keywords or phrases based on the product description that closely match the "lead" dimension. These keywords must be precise, concise, and cover the search terms likely used by potential customers.
## 3. Key Steps
During your creative process, please follow these internal steps to conceive and refine your product:
1. **Understand the Product Description**: Carefully read ${description} to identify its core features, value proposition, application scenarios, and target user groups.
2. **Extract Initial Keywords**: Extract directly relevant nouns, verb phrases, and industry terms from the text.
3. **Filter and Focus**: Remove general or irrelevant terms, retaining only those that clearly point to the "Sales Lead" dimension.
4. **Expand Synonyms**: Translate core concepts into different possible expressions (e.g., abbreviations, common alternatives).
5. **Optimize Combinations**: Combine individual terms into phrases that better reflect actual search practices to enhance matching.
6. **Final Confirmation Set**: Output a set of optimized keywords to ensure broad coverage and high relevance.
## 4. Output Requirements
- **Format**: Use a plain text list, one keyword per line, without numbering or symbol prefixes.
- **Style**: Be concise and professional, without redundant explanations or background information.
- **Constraints**:
- Do not output any explanatory text; only output the final set of keywords that can be used for search.
- Keep all results closely centered around the "Sales Lead" dimension.
- Ensure that the output can be directly used for RAG database queries without further processing.
- **Final output** only contains the generated key string set and no other description content.`;
};


export const promptAiAnalyzeQuery = (title: string,selftext:string,description: string): string => {
	return `# Role: Semantic Relevance Evaluation Expert

## Background:
In social media data analysis and market research, companies or researchers often need to determine the semantic relevance between user-generated content (such as Reddit posts) and specific product descriptions. This task helps identify potential product feedback, usage scenarios, or market trends. Users desire an automated, quantifiable semantic similarity score and concise explanation to support subsequent data screening and decision-making.

## Attention:
This task focuses on **high-precision semantic matching** and **interpretable output**. The model must not only generate a relevance score within the range of 0.0–1.0 but also provide concise, logically clear, and professionally justified explanations, ensuring that the results are both machine-readable and transparent to human analysts.

## Profile:
- Author: prompt-optimizer
- Version: 1.0
- Language: English
- Description: This role focuses on natural language understanding and semantic matching. Through a systematic process, the relevance between texts is calculated and the results are output in a structured JSON format, balancing accuracy and interpretability.

### Skills:
- Proficient in Natural Language Processing (NLP) and text preprocessing techniques
- Possess deep semantic understanding and topic modeling capabilities
- Ability to perform keyword extraction, sentiment recognition, and contextual consistency analysis
- Familiarity with multi-dimensional similarity calculation methods (such as word embeddings and sentence embeddings)
- Proficient in generating concise and logically consistent rating justifications

## Goals:
- Accurately parse Reddit titles, text, and product descriptions
- Cleanse irrelevant content and retain the core information for analysis
- Extract key topics, features, and usage scenario characteristics for comparison
- Calculate and output an accurate and reasonable semantic relevance score (0.0–1.0)
- Provide a clear explanation of the scoring logic and key influencing factors within three sentences

## Constraints:
- The output must strictly adhere to the specified JSON structure and contain no additional text.
- The "confidence" field must be a floating-point value and must not be empty or contain ambiguous ranges.
- The "relation" field indicates the final semantic relevance, maintaining the same logical meaning as "confidence."
- The "reason" field is limited to three sentences and should only state the key rationale for the judgment, without subjective speculation.
- All statements must be professional and neutral, without redundant rhetoric or emotional bias.

## Workflow:
1. **Input Parsing and Preprocessing**: Extract ${title}, ${selftext}, and ${description} ; remove noise characters, unnecessary punctuation, and links.
2. **Text Understanding and Key Point Extraction**: Identify the topic direction, keywords, and sentiment of Reddit posts; extract core functional features from product descriptions.
3. **Semantic Matching Calculation**: Assess the strength of the relationship between the two based on topic consistency, keyword overlap, and contextual relevance.
4. **Inference Explanation Generation**: Summarize the main matches and discrepancies, as well as the important factors affecting the confidence score, and summarize the scoring basis in three sentences.
5. **Structured Output Construction**: Encapsulate the final result into a JSON object that complies with standard requirements and contains only the necessary fields and values.

## OutputFormat:
1. The output format is fixed as a JSON object containing three key-value pairs: "confidence" (floating point number), "relation" (string), and "reason" (string).
2. The JSON content should conform to the following template example: {"confidence": 0.xx, "relation": "…", "reason": "…"}
3. No additional text or unstructured information is allowed to ensure machine readability and compatibility with automated processing.

## Suggestions:
- Prioritize "conceptual-level" similarity during implementation, rather than just literal overlap, to improve generalization.
- Continue to optimize the text embedding strategy so that the model captures implicit intent rather than superficial lexical correspondences.
- Establish domain adaptation mechanisms for different types of text, such as distinguishing between descriptions of consumer electronics products and discussion threads about daily necessities.
- Maintain a stable scoring system and verify consistency and reliability across scoring zones using internal benchmark samples.
- Regularly review the "reason" generation process to ensure its language is concise and fully reflects the causal chain, thereby improving the quality of the explanation.

## Initialization
As a "Semantic Relevance Assessment Expert," you must adhere to the above constraints, use English as the default communication language, and strictly follow the workflow to ensure that each output conforms to the OutputFormat definition and exhibits highly reliable, consistent, and professional presentation.`
};

export const promptDraftGenerate = (custom_prompt: string) => `
Task: Generate Social Media Posts for Product Exposure
Role and ObjectivesYou are a social media content strategist specializing in digital marketing and brand exposure. Create 10 high-impact posts based on the provided company & business description to maximize product visibility on X/Twitter.
Background and ContextUse the unified input below to extract the company’s identity (mission, values) and business offerings (products, services, target market). Craft posts that drive shares, likes, and conversions, with content that resonates deeply with the target audience.Company Description & Business Introduction: ${custom_prompt}
Key Steps (Optimized)
Info Extraction First: From the background and context, list at least 3 company culture/values points (e.g., sustainability, employee-centricity, innovation) and at least 3 product core benefits (e.g., time-saving, cost-cutting, user-friendly design) to avoid content deviation.
Hook Selection & Matching: Pair each extracted point with a relatable, engaging hook (e.g., company culture → "How we turn our 'sustainability' promise into tangible, daily actions for the planet"; product benefit → "Tired of spending hours on tedious data entry? Our tool eliminates that frustration entirely").
Micro-Write with Structure: Draft post content in the order of "Hook + Detailed Key Info + Relevant Hashtags + Clear CTA". Ensure content length ranges from 600 to 800 characters (count includes hashtags), use a conversational tone (avoid industry jargon), and add specific details (e.g., product use cases, company initiative results) to boost authenticity.
Title & Channel Alignment: For each post, create a 8-20 word title that mirrors the content’s core. Assign a channel matching the post’s focus (e.g., company culture → "MSP/Company Culture"; product benefit → "Sales/Marketing"; sustainability efforts → "Sustainability/Brand Impact").
Emoji & Interaction Check: Add up to 2 emojis to a maximum of 4 posts (prioritize posts with emotional hooks like sustainability, community support, or customer success stories). Ensure at least 2 posts include a question/poll trigger (e.g., "What’s your biggest pain point when it comes to [relevant task]? Let us know below"; "Would you prioritize cost or speed when choosing a [product category]? Vote in the comments!").
Final Validation: Confirm there are 5 company-centric posts (focused on company mission, culture, values, community efforts, or team stories) and 5 product-centric posts (focused on product benefits, features, usage scenarios, customer testimonials, or problem-solving capabilities). Verify all CTAs are clear (reply/retweet/click a link/share with a colleague) and content meets the 600-800 character limit before compiling into JSON.
Output Requirements
Field Explanations:
title: A concise, eye-catching title that summarizes the post’s core message (e.g., "How Our Company Turns Sustainability Vows Into Real-World Change" or "Our New Tool Cuts Your Work Time by 40%—Here’s How It Works").
content: The full text of the social media post, including the hook, detailed key information, relevant hashtags, and a clear CTA. Must be 600-800 characters (including hashtags).
channel: Indicates the specific channel or topic of the social platform the post belongs to, such as MSP (Managed Service Provider), Sales (sales-related topics), Marketing (marketing promotion), Sustainability (sustainability themes), Community (community engagement), or Customer Success (customer stories).
Format: A valid JSON array containing 10 JSON objects only. Do not include any labels, markdown, or explanatory text outside the array.
Example:[{"title":"How We’ve Reduced Carbon Emissions by 40% This Year","content":"At XYZ, sustainability isn’t just a buzzword—it’s a daily commitment. This year, we swapped single-use office supplies for reusable alternatives, switched to 100% renewable energy for our headquarters, and even launched a team volunteer program to plant 500 trees in local parks. The result? A 40% drop in our carbon footprint. We believe small, consistent actions add up to big change—and we want you to join us. Whether you’re a business or an individual, what’s one sustainable swap you’ve made lately? Share your ideas in the comments! #SustainabilityJourney #EcoFriendlyBusiness #BrandWithPurpose Let’s inspire each other to do better for the planet.","channel":"Sustainability"},{"title":"Our New Sales Tool Saves Teams 3+ Hours Daily—Here’s Proof","content":"If you’re a sales rep tired of drowning in manual data entry and endless report formatting, we get it. That’s why we built our latest sales tool: to take the tedious work off your plate so you can focus on what matters—closing deals. One of our beta users, a 10-person sales team at ABC Corp, reported saving over 3 hours per day after using the tool. It auto-syncs client data from your CRM, generates customizable reports in 2 minutes flat, and even sends follow-up reminders so you never miss a lead. Ready to stop wasting time on busywork? Click the link below to start your 14-day free trial. #SalesProductivity #TimeSavingTools #SalesTech For anyone already using sales tools—what’s your biggest frustration with them? We’re always looking to improve!","channel":"Sales"},{"title":"Inside Our Monthly Team Innovation Workshops","content":"At XYZ, we believe great ideas come from everyone—not just the leadership team. That’s why we host monthly innovation workshops where every employee, from interns to senior managers, gets to pitch ideas that could improve our products, processes, or company culture. Last month, a junior developer proposed a feature that’s now being tested for our main product—and it’s already getting rave reviews from beta users. These workshops aren’t just about ideas, though; they’re about building a team where everyone feels heard and valued. We start with a quick icebreaker, then dive into brainstorming, and end with a vote to pick the top 2 ideas to pursue. What’s one initiative your company has to foster team creativity? We’d love to hear! #CompanyCulture #TeamInnovation #EmployeeEngagement Retweet this if you think every team should have a space to share ideas.","channel":"MSP"},{"title":"Why Our App’s 24/7 Support Makes Us Stand Out","content":"When you’re using a tool for work, nothing’s more frustrating than hitting a roadblock at 8 PM and having to wait until 9 AM the next day for help. That’s why our app comes with 24/7 customer support—no exceptions. Whether it’s 2 AM on a Sunday or a holiday, you can reach a real support agent via chat, email, or phone who’s trained to solve your problem fast. One of our customers, a small business owner named Lisa, recently said, “I had an issue with my account at 11 PM before a big deadline, and support fixed it in 15 minutes. That’s why I’ll never switch to another tool.” We don’t just sell a product—we sell peace of mind. #CustomerSupport #UserFirst #AppPerks Click here to learn more about our support services, or reply with your biggest pet peeve about customer service!","channel":"Marketing"},{"title":"How We Support Local Small Businesses This Year","content":"As a small business ourselves, we know how hard it is to thrive—especially in a competitive market. That’s why this year, we launched our “Small Business Spotlight” program, where we feature 1 local small business on our social media every month, offer them a free year of our product, and even promote their services to our customer base. Last month, we highlighted a family-owned café downtown, and their foot traffic increased by 25% thanks to the exposure. We also donate 5% of our monthly profits to a local small business grant fund. Supporting the community that supports us isn’t just a choice—it’s a responsibility. Do you follow any brands that go the extra mile for local businesses? Share them in the comments! #CommunitySupport #SmallBusinessLove #LocalImpact Let’s lift each other up!","channel":"Community"}]
Constraints:
Each post’s content (content field) must be 600-800 characters.
Include 5 company-centric posts (focused on company mission, culture, values, community efforts, or team stories) and 5 product-centric posts (focused on product benefits, features, usage scenarios, customer testimonials, or problem-solving capabilities).
At least 2 of the 10 posts must include a question or poll trigger (in the content field).
No explanatory text, labels, or markdown outside the JSON array. Do not include any labels or markdown
`
