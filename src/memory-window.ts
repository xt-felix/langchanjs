// 文件：src/ch02/memory-window.ts
// 演示如何使用 LangChain 的记忆管理功能实现持续对话

import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";

import * as dotenv from "dotenv";
dotenv.config();

// 步骤1: 创建聊天提示词模板
// MessagesPlaceholder("history") 是占位符，会被历史消息替换
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是持续对话的技术顾问，回答要简洁并引用上下文"],
  new MessagesPlaceholder("history"), // 历史消息会插入到这里
  ["human", "{input}"],
]);

// 步骤2: 创建模型
const model = new ChatOpenAI({
  temperature: 0,
  callbacks: [new ConsoleCallbackHandler()],
});

// 步骤3: 组合成基础链
const chain = prompt.pipe(model);

// 步骤4: 使用 InMemoryChatMessageHistory 存储每个会话的历史
// 这是一个简单的内存存储，实际生产环境可以替换为 Redis、数据库等
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

// 步骤5: 使用 RunnableWithMessageHistory 包装链，自动管理历史
// 这个包装器会：
// 1. 在调用前从 messageHistory 加载历史消息
// 2. 将历史消息注入到 prompt 的 "history" 占位符
// 3. 在调用后自动保存用户输入和 AI 响应到 messageHistory
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  // getMessageHistory: 根据 sessionId 获取或创建对应的消息历史
  getMessageHistory: (sessionId: string) => {
    if (!messageHistories[sessionId]) {
      messageHistories[sessionId] = new InMemoryChatMessageHistory();
    }
    return messageHistories[sessionId];
  },
  // inputMessagesKey: 指定输入中哪个字段是用户消息（默认是整个输入）
  inputMessagesKey: "input",
  // historyMessagesKey: 指定历史消息注入到 prompt 的哪个变量
  historyMessagesKey: "history",
});

// 步骤6: 调用链时需要提供 sessionId
export async function chatOnce(text: string, sessionId: string = "default") {
  const res = await chainWithHistory.invoke(
    { input: text },
    {
      configurable: {
        sessionId, // 指定会话 ID，不同的 sessionId 有独立的历史记录
      },
    }
  );
  console.log(res.content);
}

if (require.main === module) {
  (async () => {
    // 同一个 sessionId 的对话会共享历史
    await chatOnce("前端性能优化有哪些方面？", "session-1");
    await chatOnce("继续说说 CSS 层面的优化。", "session-1");

    console.log("\n--- 新会话 ---\n");

    // 不同 sessionId 的对话有独立的历史
    await chatOnce("React 和 Vue 有什么区别？", "session-2");
  })();
}
