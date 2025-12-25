/**
 * Summary Memory：用摘要压缩历史
 * 
 * ConversationSummaryMemory：
 * - 使用 LLM 将历史对话压缩成摘要
 * - 优点：可以保留长期信息，同时控制 token 数量
 * - 缺点：摘要可能丢失细节，需要定期重新生成
 * 
 * 适用场景：
 * - 需要长期记忆但对话轮数很多
 * - 需要保留关键信息但成本敏感
 */

import { ChatOpenAI } from "@langchain/openai";
// 注意：ConversationSummaryMemory 可能需要从 @langchain/community 导入
// 这里使用简化实现：手动生成摘要
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

/**
 * 初始化 LLM（用于生成摘要）
 */
const llm = new ChatOpenAI({ temperature: 0 });

/**
 * 创建摘要记忆
 * 
 * 使用 InMemoryChatMessageHistory 存储消息
 * 手动实现摘要逻辑：当消息过多时生成摘要
 */
const messageHistory = new InMemoryChatMessageHistory();
let summary = ""; // 存储摘要

// 生成摘要
async function generateSummary(): Promise<string> {
  const messages = await messageHistory.getMessages();
  if (messages.length < 5) {
    return ""; // 消息太少，不需要摘要
  }
  
  const historyText = messages
    .map((m) => {
      // 检查消息类型（HumanMessage, AIMessage, SystemMessage 等）
      const msgType = m.constructor.name.replace("Message", "").toLowerCase();
      return `${msgType}: ${m.content}`;
    })
    .join("\n");
  
  const summaryPrompt = `请将以下对话历史压缩为简洁的摘要，保留关键信息：\n\n${historyText}\n\n摘要：`;
  const response = await llm.invoke(summaryPrompt);
  return response.content || String(response);
}

// 获取历史（包含摘要和最近消息）
async function getSummaryHistory() {
  const messages = await messageHistory.getMessages();
  
  // 如果消息很多，生成摘要
  if (messages.length > 10) {
    const newSummary = await generateSummary();
    if (newSummary) {
      summary = newSummary;
      // 清空旧消息，只保留最近 2 条
      const recentMessages = messages.slice(-2);
      await messageHistory.clear();
      for (const msg of recentMessages) {
        const msgType = msg.constructor.name;
        if (msgType === "HumanMessage") {
          await messageHistory.addUserMessage(msg.content);
        } else if (msgType === "AIMessage" || msgType === "ChatMessage") {
          await messageHistory.addAIChatMessage(msg.content);
        }
      }
    }
  }
  
  const currentMessages = await messageHistory.getMessages();
  const result: Array<{ role: string; content: string }> = [];
  
  // 如果有摘要，先添加摘要
  if (summary) {
    result.push({ role: "system", content: `历史摘要：${summary}` });
  }
  
  // 添加最近的消息
  currentMessages.forEach((msg) => {
    const msgType = msg.constructor.name;
    const role = msgType === "HumanMessage" ? "human" : "ai";
    result.push({
      role,
      content: msg.content,
    });
  });
  
  return result;
}

/**
 * 创建 Prompt 模板
 */
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是严谨的技术文档助手，擅长总结与引用。回答时要简洁准确。"],
  new MessagesPlaceholder("history"), // 历史摘要会注入这里
  ["human", "{input}"],
]);

/**
 * 构建处理链
 */
const chain = RunnableSequence.from([
  // 步骤 1：加载记忆（包含摘要）
  async (input: { input: string }) => {
    const history = await getSummaryHistory();
    return {
      ...input,
      history, // 包含摘要和历史消息
    };
  },
  
  // 步骤 2：填充 Prompt 并调用模型
  prompt,
  llm,
]);

/**
 * 对话函数
 */
export async function chat(q: string) {
  // 先保存用户输入
  await messageHistory.addUserMessage(q);
  
  // 调用链
  const res = await chain.invoke({ input: q });
  const content = res.content || String(res);
  
  // 保存 AI 输出
  await messageHistory.addAIChatMessage(content);
  
  console.log("AI:", content);
  
  // 查看当前摘要
  const currentHistory = await getSummaryHistory();
  const summaryText = currentHistory.find((m) => m.role === "system");
  if (summaryText) {
    console.log("\n当前摘要:", summaryText.content);
  }
  
  return { content };
}

/**
 * 演示摘要记忆
 */
if (require.main === module) {
  (async () => {
    console.log("=== 摘要记忆演示 ===\n");
    console.log("摘要记忆会自动压缩历史对话，保留关键信息\n");
    
    await chat("请总结我们要做的性能优化路线");
    console.log("\n---\n");
    
    await chat("针对图片和脚本分别给出 3 条建议");
    console.log("\n---\n");
    
    await chat("把总结浓缩为 5 个要点");
    console.log("\n---\n");
    
    // 即使对话很多，摘要也会保留关键信息
    await chat("我们之前讨论过哪些优化策略？");
  })();
}

