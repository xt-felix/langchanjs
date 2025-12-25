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

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * 工具函数：将消息内容转换为字符串
 */
function getMessageContent(content: string | Array<unknown>): string {
  if (typeof content === "string") {
    return content;
  }
  // 如果是数组，尝试提取文本内容
  return JSON.stringify(content);
}

/**
 * 摘要记忆管理器
 */
class SummaryMemoryManager {
  private messageHistory: InMemoryChatMessageHistory;
  private summary: string = "";
  private llm: ChatOpenAI;
  private summaryThreshold: number; // 触发摘要的消息数量阈值
  private keepRecentCount: number; // 生成摘要后保留的最近消息数

  constructor(
    llm: ChatOpenAI,
    summaryThreshold: number = 10,
    keepRecentCount: number = 2
  ) {
    this.messageHistory = new InMemoryChatMessageHistory();
    this.llm = llm;
    this.summaryThreshold = summaryThreshold;
    this.keepRecentCount = keepRecentCount;
  }

  /**
   * 生成摘要
   */
  private async generateSummary(): Promise<string> {
    const messages = await this.messageHistory.getMessages();
    if (messages.length < 5) {
      return ""; // 消息太少，不需要摘要
    }

    const historyText = messages
      .map((m: BaseMessage) => {
        const msgType = m.constructor.name.replace("Message", "").toLowerCase();
        const content = getMessageContent(m.content);
        return `${msgType}: ${content}`;
      })
      .join("\n");

    const summaryPrompt = `请将以下对话历史压缩为简洁的摘要，保留关键信息：\n\n${historyText}\n\n摘要：`;
    const response = await this.llm.invoke(summaryPrompt);
    return getMessageContent(response.content);
  }

  /**
   * 获取历史（包含摘要和最近消息）
   */
  async getHistory(): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.messageHistory.getMessages();

    // 如果消息很多，生成摘要
    if (messages.length > this.summaryThreshold) {
      const newSummary = await this.generateSummary();
      if (newSummary) {
        this.summary = newSummary;
        // 清空旧消息，只保留最近几条
        const recentMessages = messages.slice(-this.keepRecentCount);
        await this.messageHistory.clear();
        
        for (const msg of recentMessages) {
          const msgType = msg.constructor.name;
          const content = getMessageContent(msg.content);
          if (msgType === "HumanMessage") {
            await this.messageHistory.addUserMessage(content);
          } else if (msgType === "AIMessage" || msgType === "ChatMessage") {
            await this.messageHistory.addAIMessage(content);
          }
        }
      }
    }

    const currentMessages = await this.messageHistory.getMessages();
    const result: Array<{ role: string; content: string }> = [];

    // 如果有摘要，先添加摘要
    if (this.summary) {
      result.push({ role: "system", content: `历史摘要：${this.summary}` });
    }

    // 添加最近的消息
    currentMessages.forEach((msg: BaseMessage) => {
      const msgType = msg.constructor.name;
      const role = msgType === "HumanMessage" ? "human" : "ai";
      const content = getMessageContent(msg.content);
      result.push({ role, content });
    });

    return result;
  }

  /**
   * 添加用户消息
   */
  async addUserMessage(content: string): Promise<void> {
    await this.messageHistory.addUserMessage(content);
  }

  /**
   * 添加 AI 消息
   */
  async addAIMessage(content: string): Promise<void> {
    await this.messageHistory.addAIMessage(content);
  }

  /**
   * 获取当前摘要
   */
  getSummary(): string {
    return this.summary;
  }

  /**
   * 清空记忆
   */
  async clear(): Promise<void> {
    await this.messageHistory.clear();
    this.summary = "";
  }
}

/**
 * 创建摘要记忆管理器实例
 */
const llm = new ChatOpenAI({ temperature: 0 });
const memoryManager = new SummaryMemoryManager(llm, 10, 2);

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
    const history = await memoryManager.getHistory();
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
  await memoryManager.addUserMessage(q);

  // 调用链
  const res = await chain.invoke({ input: q });
  const content = getMessageContent(res.content);

  // 保存 AI 输出
  await memoryManager.addAIMessage(content);

  console.log("AI:", content);

  // 查看当前摘要
  const currentSummary = memoryManager.getSummary();
  if (currentSummary) {
    console.log("\n📝 当前摘要:", currentSummary);
  }

  return { content };
}

/**
 * 演示摘要记忆
 */
if (require.main === module) {
  (async () => {
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║              摘要记忆（Summary Memory）演示                    ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log("💡 摘要记忆会自动压缩历史对话，保留关键信息");
    console.log("⚙️  配置：超过 10 条消息时触发摘要，保留最近 2 条消息\n");
    console.log("─".repeat(60));
    console.log("\n");

    // 第一轮对话
    console.log("【第 1 轮对话】");
    await chat("请总结我们要做的性能优化路线");
    console.log("\n" + "─".repeat(60) + "\n");

    // 第二轮对话
    console.log("【第 2 轮对话】");
    await chat("针对图片和脚本分别给出 3 条建议");
    console.log("\n" + "─".repeat(60) + "\n");

    // 第三轮对话
    console.log("【第 3 轮对话】");
    await chat("把总结浓缩为 5 个要点");
    console.log("\n" + "─".repeat(60) + "\n");

    // 添加更多对话以触发摘要
    console.log("【第 4-6 轮对话】添加更多对话以触发摘要...\n");
    await chat("CSS 优化有哪些方法？");
    console.log("\n");
    await chat("JavaScript 打包优化呢？");
    console.log("\n");
    await chat("网络请求如何优化？");
    console.log("\n" + "─".repeat(60) + "\n");

    // 测试摘要效果
    console.log("【第 7 轮对话】测试摘要效果（引用之前的讨论）");
    await chat("我们之前讨论过哪些优化策略？");
    console.log("\n" + "─".repeat(60) + "\n");

    // 总结
    console.log("\n📊 摘要记忆的优势：");
    console.log("  ✅ 自动压缩：对话超过阈值时自动生成摘要");
    console.log("  ✅ 节省 Token：只保留摘要 + 最近几条消息");
    console.log("  ✅ 保留关键信息：摘要包含所有重要讨论点");
    console.log("  ✅ 长期记忆：适合长对话场景\n");
  })();
}

