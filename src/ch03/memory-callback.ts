/**
 * Callback：观测记忆读写
 * 
 * 使用 Callback 可以：
 * - 监控 Memory 的加载和保存
 * - 记录 token 使用情况
 * - 调试对话流程
 * - 性能分析
 */

import { ConsoleCallbackHandler } from "@langchain/core/callbacks/console";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SimpleMemory } from "./custom-memory";

/**
 * 创建带 Callback 的模型
 */
const model = new ChatOpenAI({
  callbacks: [new ConsoleCallbackHandler()], // 控制台回调
  verbose: true, // 启用详细日志
  temperature: 0,
});

/**
 * 创建 Prompt 模板
 */
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你会在输出中标注使用到的历史要点。回答要简洁。"],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

/**
 * 创建 Memory
 */
const memory = new SimpleMemory("callback-demo");

/**
 * 构建处理链
 */
const chain = RunnableSequence.from([
  // 步骤 1：加载记忆
  async (input: { input: string }) => {
    console.log("\n[Callback] 开始加载记忆...");
    const memoryVars = await memory.loadMemoryVariables({});
    const history = memoryVars.history as Array<{ role: string; content: string }>;
    console.log(`[Callback] 加载了 ${history.length} 条历史消息`);
    return { input: input.input, history };
  },

  // 步骤 2：调用模型
  prompt,
  model,

  // 步骤 3：保存记忆
  async (output) => {
    console.log("\n[Callback] 开始保存记忆...");
    // 注意：这里需要从配置中获取原始输入
    return output;
  },
]);

/**
 * 运行对话
 */
export async function run(history: Array<{ role: string; content: string }>, input: string) {
  // 先手动设置历史（演示用）
  if (history.length > 0) {
    for (const msg of history) {
      if (msg.role === "human") {
        await memory.saveContext({ input: msg.content }, { content: "" });
      }
    }
  }

  const res = await chain.invoke({ input });
  await memory.saveContext({ input }, { content: res.content || String(res) });
  console.log("\nAI 回答:", res.content || res);
  return res;
}

/**
 * 演示
 */
if (require.main === module) {
  (async () => {
    console.log("=== Callback 演示 ===\n");
    console.log("观察控制台输出，可以看到详细的执行过程\n");

    await run(
      [{ role: "human", content: "我们讨论了性能优化" }],
      "继续说说缓存策略"
    );
  })();
}

