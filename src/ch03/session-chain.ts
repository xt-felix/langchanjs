/**
 * Runnable：带会话的可复用链
 * 
 * 特点：
 * - 每个会话有独立的 Memory
 * - 链可以复用，但记忆是隔离的
 * - 适合多用户、多会话场景
 */

import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SimpleMemory } from "./custom-memory";

/**
 * 创建会话链工厂函数
 * 
 * @param sessionId - 会话ID，用于隔离不同会话的记忆
 * @returns 配置好的处理链
 */
export function createSessionChain(sessionId: string) {
  // 为每个会话创建独立的 Memory
  const memory = new SimpleMemory(sessionId);

  // 创建 Prompt 模板
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是稳健的技术助手，遇到不确定请先提问澄清。回答要简洁实用。"],
    new MessagesPlaceholder("history"), // 注入历史消息
    ["human", "{input}"],
  ]);

  // 构建处理链
  return RunnableSequence.from([
    // 步骤 1：加载历史消息
    async (input: { input: string }) => {
      const memoryVariables = await memory.loadMemoryVariables({});
      return {
        input: input.input,
        history: memoryVariables.history as Array<{ role: string; content: string }>,
      };
    },

    // 步骤 2：填充 Prompt 并调用模型
    prompt,
    new ChatOpenAI({ temperature: 0 }),
    new StringOutputParser(),

    // 步骤 3：保存对话到 Memory
    async (out: string, config?: { configurable?: { input?: { input: string } } }) => {
      // 从配置中获取原始输入
      const originalInput = config?.configurable?.input?.input || "";
      await memory.saveContext({ input: originalInput }, { content: out });
      return out;
    },
  ]);
}

/**
 * 使用示例
 */
if (require.main === module) {
  (async () => {
    console.log("=== 会话链演示 ===\n");

    // 创建两个不同的会话
    const session1 = createSessionChain("user-001");
    const session2 = createSessionChain("user-002");

    console.log("会话 1 (user-001):");
    const res1 = await session1.invoke({ input: "什么是 React？" });
    console.log("AI:", res1);
    console.log("\n---\n");

    console.log("会话 2 (user-002):");
    const res2 = await session2.invoke({ input: "什么是 Vue？" });
    console.log("AI:", res2);
    console.log("\n---\n");

    // 会话 1 继续对话（有上下文）
    console.log("会话 1 继续:");
    const res3 = await session1.invoke({ input: "它有什么优势？" });
    console.log("AI:", res3);
    console.log("\n---\n");

    // 会话 2 继续对话（独立的上下文）
    console.log("会话 2 继续:");
    const res4 = await session2.invoke({ input: "它有什么优势？" });
    console.log("AI:", res4);
  })();
}

