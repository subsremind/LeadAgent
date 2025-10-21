import { openaiService, OpenAIService } from '../lib';
/**
 * OpenAI服务使用示例
 */
async function main() {
    try {
        console.log('OpenAI服务使用示例');
        console.log('==================');
        // 示例1: 使用默认实例生成文本
        console.log('\n示例1: 使用默认实例生成文本');
        console.log('------------------------');
        const prompt = '请用一句话解释人工智能是什么';
        const response = await openaiService.generateText(prompt, {
            model: 'gpt-3.5-turbo',
            maxTokens: 100,
            temperature: 0.7,
            userId: 'user-123', // 可选：用户ID，用于日志记录
        });
        console.log('提示:', prompt);
        console.log('响应:', response);
        // 示例2: 使用自定义配置进行聊天完成
        console.log('\n示例2: 使用自定义配置进行聊天完成');
        console.log('------------------------------');
        const chatConfig = {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: '你是一个有用的助手' },
                { role: 'user', content: '如何提高代码质量？' }
            ],
            max_tokens: 200,
            temperature: 0.8,
        };
        const chatResponse = await openaiService.chatCompletion(chatConfig, {
            organizationId: 'org-456', // 可选：组织ID，用于日志记录
        });
        console.log('聊天响应:', chatResponse.choices[0]?.message?.content || '');
        console.log('Token使用情况:', chatResponse.usage);
        // 示例3: 创建新的服务实例（使用自定义API密钥）
        console.log('\n示例3: 创建新的服务实例');
        console.log('---------------------');
        // 注意：在实际使用中，不要硬编码API密钥，应该从环境变量或安全存储中获取
        const customApiKey = process.env.CUSTOM_OPENAI_API_KEY; // 示例：从环境变量获取
        if (customApiKey) {
            const customService = new OpenAIService(customApiKey);
            const customResponse = await customService.generateText('什么是TypeScript？', {
                model: 'gpt-3.5-turbo',
            });
            console.log('自定义服务响应:', customResponse);
        }
        else {
            console.log('跳过：未提供自定义API密钥');
        }
        // 示例4: 流式响应（简化版）
        console.log('\n示例4: 流式响应');
        console.log('----------------');
        console.log('流式输出:');
        let fullStreamResponse = '';
        await openaiService.streamChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: '请简单介绍一下React框架' }],
            max_tokens: 150,
        }, (chunk, isFinal) => {
            fullStreamResponse += chunk;
            process.stdout.write(chunk); // 直接输出到控制台
            if (isFinal) {
                console.log('\n流式响应完成');
                console.log('完整响应:', fullStreamResponse);
            }
        }, {
            userId: 'stream-user-789',
        });
    }
    catch (error) {
        console.error('错误:', error);
    }
}
// 运行示例
main().then(() => {
    console.log('\n示例运行完成');
});
