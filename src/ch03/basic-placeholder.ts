/**
 * 基础示例：使用 MessagesPlaceholder 注入历史对话
 * 
 * 核心概念：
 * - MessagesPlaceholder 是 LangChain 提供的占位符，用于在 Prompt 中注入历史消息
 * - 历史消息可以从 Memory 系统加载，实现多轮对话的上下文连续性
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * 创建包含历史消息占位符的 Prompt 模板
 */
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是简洁的前端顾问，擅长性能优化和用户体验提升。"],
  new MessagesPlaceholder("history"), // 历史消息占位符
  ["human", "{input}"], // 当前用户输入
]);

/**
 * 构建处理链
 */
const model = new ChatOpenAI({ temperature: 0 });
const chain = prompt.pipe(model).pipe(new StringOutputParser());

/**
 * 运行对话函数
 * 
 * @param history - 历史消息数组，格式：[{ role: "human" | "ai" | "system", content: string }]
 * @param input - 当前用户输入
 */
export async function run(history: Array<{ role: string; content: string }>, input: string) {
  const out = await chain.invoke({ history, input });
  console.log("AI 回答:", out);
  return out;
}

/**
 * 示例：演示如何使用历史上下文
 */
if (require.main === module) {
  (async () => {
    console.log("=== 示例 1：带历史上下文的对话 ===\n");
    
    // 第一轮对话
    const history1: Array<{ role: string; content: string }> = [
      { role: "human", content: "我们刚讨论了首屏优化" },
    ];
    
    await run(history1, "继续说说图片优化");
    
    console.log("\n=== 示例 2：多轮对话 ===\n");
    
    // 第二轮对话（包含之前的对话历史）
    const history2: Array<{ role: string; content: string }> = [
      { role: "human", content: "我们刚讨论了首屏优化" },
      { role: "ai", content: "首屏优化主要包括：减少关键资源大小、延迟加载非关键资源、使用 CDN 加速等。" },
      { role: "human", content: "图片优化有哪些方法？" },
      { role: "ai", content: "图片优化包括：使用 WebP 格式、懒加载、响应式图片、图片压缩等。" },
    ];
    
    await run(history2, "那脚本优化呢？");
  })();
}

