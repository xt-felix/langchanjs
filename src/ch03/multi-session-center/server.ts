/**
 * 实战项目一：多用户会话中心
 * 
 * 功能：
 * - 支持多用户、多会话
 * - Redis 持久化 Memory
 * - 流式响应
 * - 错误处理
 * 
 * 数据结构：
 * - 会话键：session:{tenantId}:{userId}:{sessionId}
 * - 值：JSON 数组 [{ role, content, ts }]
 */

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

/**
 * Redis 客户端接口（简化版）
 * 实际使用需要安装 redis 包：npm install redis
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<number>;
}

/**
 * 模拟 Redis 客户端（用于演示）
 * 生产环境请使用真实的 Redis 客户端
 */
class MockRedisClient implements RedisClient {
  private store: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    this.store.set(key, value);
    // 模拟过期（实际 Redis 会自动处理）
    if (options?.EX) {
      setTimeout(() => this.store.delete(key), options.EX * 1000);
    }
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

/**
 * 会话消息类型
 */
type SessionMessage = {
  role: "human" | "ai" | "system";
  content: string;
  ts: number;
};

/**
 * 会话管理器
 */
export class SessionManager {
  constructor(
    private client: RedisClient,
    private defaultTtl: number = 60 * 60 * 24 * 7 // 默认 7 天过期
  ) {}

  /**
   * 获取会话键
   */
  private getSessionKey(tenantId: string, userId: string, sessionId: string): string {
    return `session:${tenantId}:${userId}:${sessionId}`;
  }

  /**
   * 加载会话历史
   */
  async loadHistory(
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<SessionMessage[]> {
    try {
      const key = this.getSessionKey(tenantId, userId, sessionId);
      const raw = await this.client.get(key);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as SessionMessage[];
    } catch (error) {
      console.error("加载历史失败:", error);
      return [];
    }
  }

  /**
   * 保存消息到会话
   */
  async saveMessage(
    tenantId: string,
    userId: string,
    sessionId: string,
    role: "human" | "ai",
    content: string
  ): Promise<void> {
    try {
      const key = this.getSessionKey(tenantId, userId, sessionId);
      const history = await this.loadHistory(tenantId, userId, sessionId);

      history.push({
        role,
        content,
        ts: Date.now(),
      });

      await this.client.set(key, JSON.stringify(history), {
        EX: this.defaultTtl,
      });
    } catch (error) {
      console.error("保存消息失败:", error);
      // 容错：不抛出错误
    }
  }

  /**
   * 清空会话
   */
  async clearSession(
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<void> {
    const key = this.getSessionKey(tenantId, userId, sessionId);
    await this.client.del(key);
  }
}

/**
 * 创建聊天处理链
 */
function createChatChain() {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是客服助手，回答要简洁且引用历史。遇到不确定请先提问澄清。"],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const model = new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-3.5-turbo",
  });

  return prompt.pipe(model).pipe(new StringOutputParser());
}

/**
 * 处理聊天请求
 */
export async function handleChatRequest(
  sessionManager: SessionManager,
  tenantId: string,
  userId: string,
  sessionId: string,
  input: string
): Promise<string> {
  // 1. 加载历史
  const history = await sessionManager.loadHistory(tenantId, userId, sessionId);

  // 2. 转换为 LangChain 消息格式
  const langchainHistory = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // 3. 调用模型
  const chain = createChatChain();
  const output = await chain.invoke({
    history: langchainHistory,
    input,
  });

  // 4. 保存对话（异步，不阻塞响应）
  Promise.all([
    sessionManager.saveMessage(tenantId, userId, sessionId, "human", input),
    sessionManager.saveMessage(tenantId, userId, sessionId, "ai", output),
  ]).catch((err) => console.error("保存消息失败:", err));

  return output;
}

/**
 * 流式处理聊天请求
 */
export async function* handleChatStream(
  sessionManager: SessionManager,
  tenantId: string,
  userId: string,
  sessionId: string,
  input: string
): AsyncGenerator<string, void, unknown> {
  // 1. 加载历史
  const history = await sessionManager.loadHistory(tenantId, userId, sessionId);
  const langchainHistory = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // 2. 创建流式模型
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是客服助手，回答要简洁且引用历史。"],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const model = new ChatOpenAI({
    temperature: 0,
    streaming: true,
  });

  const chain = prompt.pipe(model);

  // 3. 流式输出
  let fullOutput = "";
  const stream = await chain.stream({
    history: langchainHistory,
    input,
  });

  for await (const chunk of stream) {
    const content = chunk.content || "";
    fullOutput += content;
    yield content;
  }

  // 4. 保存完整输出（异步）
  Promise.all([
    sessionManager.saveMessage(tenantId, userId, sessionId, "human", input),
    sessionManager.saveMessage(tenantId, userId, sessionId, "ai", fullOutput),
  ]).catch((err) => console.error("保存消息失败:", err));
}

/**
 * 使用示例
 */
if (require.main === module) {
  (async () => {
    console.log("=== 多用户会话中心演示 ===\n");

    // 创建 Redis 客户端（实际使用真实 Redis）
    const client = new MockRedisClient();
    const sessionManager = new SessionManager(client);

    const tenantId = "tenant-001";
    const userId = "user-001";
    const sessionId = "session-001";

    // 第一轮对话
    console.log("用户:", "你好");
    const res1 = await handleChatRequest(
      sessionManager,
      tenantId,
      userId,
      sessionId,
      "你好"
    );
    console.log("AI:", res1);
    console.log("\n---\n");

    // 第二轮对话（有上下文）
    console.log("用户:", "我们刚才聊了什么？");
    const res2 = await handleChatRequest(
      sessionManager,
      tenantId,
      userId,
      sessionId,
      "我们刚才聊了什么？"
    );
    console.log("AI:", res2);
    console.log("\n---\n");

    // 查看历史
    const history = await sessionManager.loadHistory(tenantId, userId, sessionId);
    console.log("会话历史:", JSON.stringify(history, null, 2));
  })();
}

