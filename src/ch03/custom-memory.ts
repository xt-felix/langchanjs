/**
 * 自定义 Memory：统一接口
 * 
 * 实现 BaseChatMemory 接口，可以：
 * - 自定义存储方式（内存、数据库、文件等）
 * - 自定义消息格式
 * - 添加额外的元数据（时间戳、会话ID等）
 */

// 定义 Memory 接口（简化版）
// 实际 LangChain.js 的 BaseChatMemory 接口定义
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
 * 消息类型定义
 */
type Message = {
  role: "human" | "ai" | "system";
  content: string;
  ts?: number; // 时间戳
  metadata?: Record<string, unknown>; // 额外元数据
};

/**
 * 简单内存实现
 * 
 * 特点：
 * - 基于内存存储（进程重启后丢失）
 * - 支持多会话隔离
 * - 支持时间戳和元数据
 */
export class SimpleMemory implements BaseChatMemory {
  memoryKey = "history";
  private store: Record<string, Message[]> = {};

  constructor(private sessionId: string) {}

  /**
   * 返回记忆键名列表
   */
  get memoryKeys(): string[] {
    return [this.memoryKey];
  }

  /**
   * 加载记忆变量
   * 
   * @param _values - 输入值（可选）
   * @returns 包含历史消息的对象
   */
  async loadMemoryVariables(_values: InputValues): Promise<Record<string, unknown>> {
    const messages = this.store[this.sessionId] || [];
    
    // 转换为 LangChain 消息格式
    return {
      [this.memoryKey]: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
  }

  /**
   * 保存上下文
   * 
   * @param inputValues - 输入值（用户消息）
   * @param outputValues - 输出值（AI 消息）
   */
  async saveContext(
    inputValues: InputValues,
    outputValues: OutputValues
  ): Promise<void> {
    const arr = this.store[this.sessionId] || (this.store[this.sessionId] = []);

    // 保存用户输入
    if (inputValues?.input) {
      arr.push({
        role: "human",
        content: String(inputValues.input),
        ts: Date.now(),
      });
    }

    // 保存 AI 输出
    if (outputValues?.content || outputValues?.output) {
      arr.push({
        role: "ai",
        content: String(outputValues.content || outputValues.output),
        ts: Date.now(),
      });
    }
  }

  /**
   * 清空记忆
   */
  async clear(): Promise<void> {
    this.store[this.sessionId] = [];
  }

  /**
   * 获取当前会话的所有消息（用于调试）
   */
  getMessages(): Message[] {
    return this.store[this.sessionId] || [];
  }

  /**
   * 获取所有会话ID（用于调试）
   */
  getAllSessionIds(): string[] {
    return Object.keys(this.store);
  }
}

/**
 * 使用示例
 */
if (require.main === module) {
  (async () => {
    const memory = new SimpleMemory("session-001");

    // 保存几轮对话
    await memory.saveContext({ input: "你好" }, { content: "你好！有什么可以帮助你的？" });
    await memory.saveContext({ input: "什么是 React？" }, { content: "React 是一个用于构建用户界面的 JavaScript 库。" });

    // 加载记忆
    const vars = await memory.loadMemoryVariables({});
    console.log("当前记忆:", JSON.stringify(vars, null, 2));

    // 查看原始消息
    console.log("\n原始消息:", memory.getMessages());
  })();
}

