/**
 * 实战项目二：个性化学习助手（长期记忆）
 * 
 * 功能：
 * - 向量存储用户偏好、知识卡片、易错点
 * - 摘要压缩长期记忆
 * - 按需检索相关事实
 * - 阶段性摘要生成
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * 用户信息类型
 */
type User = {
  id: string;
  preferences?: string[];
  learningHistory?: string[];
  weakPoints?: string[];
};

/**
 * 事实卡片类型
 */
type FactCard = {
  id: string;
  userId: string;
  content: string;
  category: "preference" | "knowledge" | "weakpoint";
  timestamp: number;
};

/**
 * 向量检索器接口（简化版）
 */
interface VectorRetriever {
  getRelevantDocuments(query: string, userId: string): Promise<FactCard[]>;
  addDocument(card: FactCard): Promise<void>;
}

/**
 * 模拟向量检索器
 */
class MockVectorRetriever implements VectorRetriever {
  private store: FactCard[] = [];

  async getRelevantDocuments(query: string, userId: string): Promise<FactCard[]> {
    // 简单的关键词匹配（实际应该使用向量相似度）
    return this.store.filter(
      (card) =>
        card.userId === userId &&
        (card.content.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(card.content.toLowerCase()))
    );
  }

  async addDocument(card: FactCard): Promise<void> {
    this.store.push(card);
  }
}

/**
 * 摘要存储接口
 */
interface SummaryStore {
  getSummary(userId: string): Promise<string | null>;
  updateSummary(userId: string, summary: string): Promise<void>;
}

/**
 * 模拟摘要存储
 */
class MockSummaryStore implements SummaryStore {
  private store: Record<string, string> = {};

  async getSummary(userId: string): Promise<string | null> {
    return this.store[userId] || null;
  }

  async updateSummary(userId: string, summary: string): Promise<void> {
    this.store[userId] = summary;
  }
}

/**
 * 学习助手编排器
 */
export class LearningAssistantOrchestrator {
  constructor(
    private vectorRetriever: VectorRetriever,
    private summaryStore: SummaryStore,
    private llm: ChatOpenAI
  ) {}

  /**
   * 加载用户信息（简化版）
   */
  private async loadUser(userId: string): Promise<User> {
    // 实际应该从数据库加载
    return {
      id: userId,
      preferences: ["暗色主题", "响应式布局"],
      learningHistory: ["React Hooks", "TypeScript"],
      weakPoints: ["异步编程", "性能优化"],
    };
  }

  /**
   * 检索长期记忆（向量检索）
   */
  private async retrieveLongTermMemory(query: string, userId: string): Promise<FactCard[]> {
    return await this.vectorRetriever.getRelevantDocuments(query, userId);
  }

  /**
   * 加载或更新摘要
   */
  private async loadOrUpdateSummary(
    userId: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    // 如果对话轮数较多，生成新摘要
    if (conversationHistory.length > 10) {
      const summaryPrompt = `请将以下对话历史压缩为简洁的摘要，保留关键信息：

${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

摘要：`;

      const summary = await this.llm.invoke(summaryPrompt);
      const summaryText = summary.content || String(summary);
      await this.summaryStore.updateSummary(userId, summaryText);
      return summaryText;
    }

    // 否则返回现有摘要
    return (await this.summaryStore.getSummary(userId)) || "";
  }

  /**
   * 构建 Prompt
   */
  private buildPrompt(
    query: string,
    facts: FactCard[],
    summary: string,
    user: User
  ): string {
    const factsText = facts
      .map((f) => `- [${f.category}] ${f.content}`)
      .join("\n");

    const summaryText = summary ? `\n\n历史摘要：\n${summary}` : "";

    const userInfo = `
用户偏好：${user.preferences?.join("、") || "无"}
学习历史：${user.learningHistory?.join("、") || "无"}
薄弱点：${user.weakPoints?.join("、") || "无"}
`;

    return `你是个性化学习助手，需要根据用户的学习情况和偏好提供个性化建议。

${userInfo}

相关事实：
${factsText || "无"}${summaryText}

用户问题：${query}

请基于以上信息回答，并给出学习路径建议。`;
  }

  /**
   * 编排处理流程
   */
  createOrchestrator() {
    return RunnableSequence.from([
      // 步骤 1：上下文收集
      async (input: { q: string; userId: string }) => {
        const user = await this.loadUser(input.userId);
        return { q: input.q, user };
      },

      // 步骤 2：检索长期记忆（向量）
      async (ctx) => {
        const facts = await this.retrieveLongTermMemory(ctx.q, ctx.user.id);
        return { ...ctx, facts };
      },

      // 步骤 3：历史摘要（短期→长期压缩）
      async (ctx) => {
        // 这里简化处理，实际应该从会话历史生成摘要
        const summary = await this.loadOrUpdateSummary(ctx.user.id, []);
        return { ...ctx, summary };
      },

      // 步骤 4：Prompt 组装
      async (ctx) => {
        const promptText = this.buildPrompt(ctx.q, ctx.facts, ctx.summary, ctx.user);
        return { promptText, facts: ctx.facts };
      },

      // 步骤 5：LLM 调用
      async (ctx) => {
        const response = await this.llm.invoke(ctx.promptText);
        return {
          answer: response.content || String(response),
          facts: ctx.facts,
        };
      },

      // 步骤 6：回写与打分（可选）
      async (out) => {
        // 可以在这里保存新的学习记录
        return out;
      },
    ]);
  }
}

/**
 * 使用示例
 */
if (require.main === module) {
  (async () => {
    console.log("=== 个性化学习助手演示 ===\n");

    const vectorRetriever = new MockVectorRetriever();
    const summaryStore = new MockSummaryStore();
    const llm = new ChatOpenAI({ temperature: 0 });

    // 添加一些事实卡片
    await vectorRetriever.addDocument({
      id: "fact-001",
      userId: "user-001",
      content: "用户偏好：更喜欢暗色主题",
      category: "preference",
      timestamp: Date.now(),
    });

    await vectorRetriever.addDocument({
      id: "fact-002",
      userId: "user-001",
      content: "学习历史：React Hooks 和 TypeScript",
      category: "knowledge",
      timestamp: Date.now(),
    });

    // 创建编排器
    const orchestrator = new LearningAssistantOrchestrator(
      vectorRetriever,
      summaryStore,
      llm
    );

    const chain = orchestrator.createOrchestrator();

    // 提问
    const result = await chain.invoke({
      q: "请推荐首页布局方案",
      userId: "user-001",
    });

    console.log("回答:", result.answer);
    console.log("\n引用的相关事实:");
    result.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. [${fact.category}] ${fact.content}`);
    });
  })();
}

