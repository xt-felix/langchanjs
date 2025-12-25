/**
 * Redis 持久化 Memory
 * 
 * 特点：
 * - 持久化到 Redis，进程重启后不丢失
 * - 支持过期时间（TTL）
 * - 支持多会话隔离
 * - 适合生产环境
 * 
 * 使用前需要安装：
 * npm install redis
 */

// 定义 Memory 接口（简化版）
type InputValues = Record<string, unknown>;
type OutputValues = Record<string, unknown>;

interface BaseChatMemory {
  memoryKey: string;
  memoryKeys: string[];
  loadMemoryVariables(values: InputValues): Promise<Record<string, unknown>>;
  saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Redis 客户端类型（简化版，实际使用需要安装 redis 包）
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<number>;
}

/**
 * Redis Memory 实现
 */
export class RedisMemory implements BaseChatMemory {
  memoryKey = "history";

  constructor(
    private client: RedisClient,
    private sessionId: string,
    private ttl: number = 60 * 60 * 24 // 默认 24 小时过期
  ) {}

  /**
   * 获取 Redis 键名
   */
  private getKey(): string {
    return `mem:${this.sessionId}`;
  }

  /**
   * 返回记忆键名列表
   */
  get memoryKeys(): string[] {
    return [this.memoryKey];
  }

  /**
   * 加载记忆变量
   */
  async loadMemoryVariables(_values: InputValues): Promise<Record<string, unknown>> {
    try {
      const raw = await this.client.get(this.getKey());
      if (!raw) {
        return { [this.memoryKey]: [] };
      }

      const messages = JSON.parse(raw);
      return {
        [this.memoryKey]: messages.map((m: { role: string; content: string; ts?: number }) => ({
          role: m.role,
          content: m.content,
        })),
      };
    } catch (error) {
      console.error("Redis 读取失败:", error);
      // 容错：返回空记忆
      return { [this.memoryKey]: [] };
    }
  }

  /**
   * 保存上下文
   */
  async saveContext(
    inputValues: InputValues,
    outputValues: OutputValues
  ): Promise<void> {
    try {
      // 加载现有消息
      const current = await this.loadMemoryVariables({});
      const messages = (current[this.memoryKey] as Array<{ role: string; content: string }>) || [];

      // 添加新消息
      if (inputValues?.input) {
        messages.push({
          role: "human",
          content: String(inputValues.input),
        });
      }

      if (outputValues?.content || outputValues?.output) {
        messages.push({
          role: "ai",
          content: String(outputValues.content || outputValues.output),
        });
      }

      // 保存到 Redis（带过期时间）
      await this.client.set(this.getKey(), JSON.stringify(messages), {
        EX: this.ttl,
      });
    } catch (error) {
      console.error("Redis 写入失败:", error);
      // 容错：不抛出错误，避免影响主流程
    }
  }

  /**
   * 清空记忆
   */
  async clear(): Promise<void> {
    try {
      await this.client.del(this.getKey());
    } catch (error) {
      console.error("Redis 删除失败:", error);
    }
  }
}

/**
 * 使用示例（需要实际的 Redis 客户端）
 */
if (require.main === module) {
  console.log(`
Redis Memory 使用示例：

1. 安装依赖：
   npm install redis

2. 创建 Redis 客户端：
   import { createClient } from "redis";
   const client = createClient({ url: process.env.REDIS_URL });
   await client.connect();

3. 使用 RedisMemory：
   const memory = new RedisMemory(client, "session-001", 60 * 60 * 24);
   await memory.saveContext({ input: "你好" }, { content: "你好！" });
   const vars = await memory.loadMemoryVariables({});
  `);
}

