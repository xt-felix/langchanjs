/**
 * Buffer 与 Window：权衡示例
 * 
 * ConversationBufferWindowMemory：
 * - 只保留最近 N 条消息（滑动窗口）
 * - 优点：控制 token 数量，降低成本
 * - 缺点：可能丢失早期重要信息
 * 
 * 适用场景：
 * - 对话轮数较多，但只需要最近几轮的上下文
 * - 成本敏感的场景
 */

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
// 注意：LangChain.js 的 Memory 实现可能在不同版本中位置不同
// 这里使用 InMemoryChatMessageHistory 作为替代实现
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

/**
 * 创建 Prompt 模板
 */
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是专业的性能优化顾问，回答要简洁实用。"],
  new MessagesPlaceholder("history"), // 历史消息占位符
  ["human", "{input}"],
]);

/**
 * 初始化模型
 */
const model = new ChatOpenAI({ temperature: 0.3 });

/**
 * 创建滑动窗口记忆
 * 
 * 使用 InMemoryChatMessageHistory 存储消息
 * 手动实现滑动窗口逻辑（只保留最近 4 条消息）
 */
const messageHistory = new InMemoryChatMessageHistory();

// 手动实现滑动窗口：只保留最近 4 条消息
async function getWindowedHistory() {
  const messages = await messageHistory.getMessages();
  // 只返回最近 4 条消息
  console.log(messages,'getWindowedHistory');
  return messages.slice(-4);
}

/**
 * 构建带记忆的处理链
 */
const chain = RunnableSequence.from([
  // 步骤 1：加载历史消息（滑动窗口）
  async (input: { input: string }) => {
    const history = await getWindowedHistory();
    return {
      input: input.input,
      history, // 从 Memory 加载历史（只包含最近 4 条）
      originalInput: input.input, // 保存原始输入，用于后续保存
    };
  },
  
  // 步骤 2：填充 Prompt 并调用模型
  prompt,
  model,
  
  // 步骤 3：保存当前对话到 Memory
  async (output: any, config?: any) => {
    // 从配置中获取原始输入（如果可用）
    // 注意：RunnableSequence 中传递原始输入比较复杂
    // 这里简化处理，在实际调用时手动保存
    return { output, content: output.content || String(output) };
  },
]);

/**
 * 提问函数
 */
export async function ask(q: string) {
  // 先保存用户输入
  await messageHistory.addUserMessage(q);
  
  // 调用链
  const res = await chain.invoke({ input: q });
  const content = res.content || res.output?.content || String(res);
  
  // 保存 AI 输出
  await messageHistory.addAIMessage(content);
  
  console.log("AI:", content);
  return { content };
}

/**
 * 演示多轮对话
 */
if (require.main === module) {
  (async () => {
    console.log("=== 滑动窗口记忆演示 ===\n");
    console.log("窗口大小：4 条消息（2 轮对话）\n");
    
    await ask("页面白屏如何排查？");
    console.log("\n---\n");
    
    await ask("如何用懒加载优化首屏？");
    console.log("\n---\n");
    
    await ask("图片该如何处理？");
    console.log("\n---\n");
    
    await ask("再说说骨架屏策略");
    console.log("\n---\n");
    
    // 此时窗口已满，最早的消息会被移除
    await ask("前面我们聊过哪些优化点？"); // 窗口内信息可被引用
    console.log("\n---\n");
    
    // 查看当前 Memory 中的消息数量
    const currentHistory = await getWindowedHistory();
    console.log(`当前 Memory 中的消息数: ${currentHistory.length}`);
  })();
}

