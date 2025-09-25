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
	return `##Task: Recommend the three subreddits most likely to generate sales leads.
			##Action: Analyze the provided product description, identify keywords and themes, and evaluate the sales lead potential of relevant subreddits.
			##Goal: Provide high-potential sources of sales leads to support marketing decisions.
			##Product Description: ${description} 
			##Output: Three subreddits, separated by commas.No explanations required. Examples: r/business, r/sales, r/leadgeneration`;;
};

export const promptLeadAgentQuery = (description: string): string => {
	return `##Task: Generate key strings for retrieving the Reddit RAG library. These key strings should be based on the dimension of sales leads and ensure the highest relevance.
##TAction: Based on the provided product description, analyze and extract keywords and phrases highly relevant to sales leads.
##TGoal: Produce a set of the most relevant key strings to effectively identify potential sales leads and improve retrieval efficiency.
##TProduct Description: ${description}
##TOutput: Only output the strings for retrieval, no explanations required
`;
};


