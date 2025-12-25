# Chapter 03: Memory 系统与对话状态管理 🧠

> 深入理解 LangChain.js 的 Memory 体系，掌握从基础到实战的完整对话记忆解决方案

## 📚 目录

- [什么是 Memory 系统？](#什么是-memory-系统)
- [为什么需要 Memory？](#为什么需要-memory)
- [快速开始](#快速开始)
- [核心概念详解](#核心概念详解)
- [代码示例详解](#代码示例详解)
- [实战项目](#实战项目)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

---

## 🎯 什么是 Memory 系统？

### 核心问题

大语言模型（LLM）本身是**无状态**的，每次调用都是独立的：

```typescript
// ❌ 问题：LLM 无法记住上下文
await model.invoke("我叫张三");
// 输出："你好，张三！"

await model.invoke("我叫什么名字？");
// 输出："抱歉，我不知道你的名字。"  // 忘记了！
```

### 解决方案

Memory 系统通过在每次调用时注入历史对话，让 AI 能够"记住"上下文：

```typescript
// ✅ 使用 Memory：AI 可以记住对话历史
const memory = new ConversationBufferMemory();

// 第一轮对话
await memory.saveContext(
  { input: "我叫张三" },
  { output: "你好，张三！" }
);

// 第二轮对话（包含历史）
const history = await memory.loadMemoryVariables({});
// history = [
//   { role: "human", content: "我叫张三" },
//   { role: "ai", content: "你好，张三！" }
// ]

await model.invoke([...history, "我叫什么名字？"]);
// 输出："你叫张三。"  ✅ 记住了！
```

### 项目结构

```
src/ch03/
├── basic-placeholder.ts         # 🎯 基础：MessagesPlaceholder 使用
├── window-buffer.ts             # 🪟 滑动窗口记忆（固定 Token）
├── summary.ts                   # 📝 摘要记忆（压缩历史）
├── vector-memory.ts             # 🔍 向量记忆（语义检索）
├── custom-memory.ts             # 🛠️  自定义 Memory 实现
├── redis-memory.ts              # 💾 Redis 持久化
├── session-chain.ts             # 🔗 多会话隔离
├── memory-callback.ts           # 👀 Callback 观测
├── langgraph-memory.ts          # 📊 LangGraph 集成
├── multi-session-center/        # 🏢 实战：多用户会话中心
│   └── server.ts
└── learning-assistant/          # 🎓 实战：个性化学习助手
    └── orchestrator.ts
```

---

## 🤔 为什么需要 Memory？

### 1. 多轮对话的必要性

**场景**：用户咨询问题

```
用户："我的项目用的是 React"
AI："了解，React 是一个优秀的前端框架。"

用户："如何优化它的性能？"
AI（无 Memory）："你说的'它'是什么？"  ❌ 无法理解上下文
AI（有 Memory）："React 性能优化可以从这几方面入手..."  ✅ 理解上下文
```

### 2. Token 消耗的平衡

**问题**：完整保存所有历史会导致 Token 消耗爆炸

```
假设每条消息 50 tokens：

Buffer Memory（保存所有历史）：
第 1 轮：50 tokens
第 5 轮：500 tokens
第 10 轮：1,000 tokens
第 20 轮：2,000 tokens  💸 成本持续增长

Window Memory（滑动窗口，保留 4 条消息）：
第 1 轮：50 tokens
第 5 轮：200 tokens
第 10 轮：200 tokens
第 20 轮：200 tokens  💰 成本固定
```

### 3. 三种记忆层次

```
┌─────────────────────────────────────┐
│  短期记忆（Buffer/Window）          │
│  最近几轮的完整对话                 │
│  优点：信息完整                     │
│  缺点：Token 消耗大                 │
│  适用：< 10 轮对话                  │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  中期记忆（Summary）                │
│  压缩后的对话摘要                   │
│  优点：节省 Token                   │
│  缺点：可能丢失细节                 │
│  适用：10-50 轮对话                 │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  长期记忆（Vector Store）           │
│  用户偏好、知识卡片                 │
│  优点：按需检索                     │
│  缺点：需要向量数据库               │
│  适用：个性化场景                   │
└─────────────────────────────────────┘
```

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 检查 Node.js 版本（需要 >= 16.0.0）
node --version

# 2. 安装依赖
npm install

# 3. 配置 API Key
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

### 2. 运行第一个示例

```bash
# 运行基础示例：MessagesPlaceholder
npm run memory:basic-placeholder
```

**预期输出**：

```
╔════════════════════════════════════════════════════════════════╗
║      MessagesPlaceholder 历史对话作用演示                      ║
╚════════════════════════════════════════════════════════════════╝

【场景 1】没有历史对话（AI 无法理解上下文）

用户问题："继续说说图片优化"
历史对话：无

AI 回答（无历史）:
图片优化是前端性能优化的重要方面...

❌ 问题：AI 不知道'继续'指的是什么
```

### 3. 运行其他示例

```bash
# 滑动窗口记忆
npm run memory:window-buffer

# 摘要记忆
npm run memory:summary

# 向量记忆
npm run memory:vector

# 自定义 Memory
npm run memory:custom

# Redis 持久化
npm run memory:redis

# 多会话隔离
npm run memory:session-chain

# Callback 观测
npm run memory:callback

# LangGraph 集成
npm run memory:langgraph

# 实战项目
npm run memory:multi-session
npm run memory:learning-assistant
```

---

## 🔍 核心概念详解

### 1. MessagesPlaceholder：历史消息的注入点

**什么是 MessagesPlaceholder？**

`MessagesPlaceholder` 是 LangChain 提供的占位符，用于在 Prompt 模板中动态注入历史消息数组。

**为什么需要它？**

传统的 Prompt 模板只能插入字符串：

```typescript
// ❌ 传统方式：无法优雅地插入消息数组
const prompt = `
系统：你是助手
历史：{history}  // 只能是字符串
用户：{input}
`;
```

使用 `MessagesPlaceholder` 可以插入消息数组：

```typescript
// ✅ 使用 MessagesPlaceholder：可以插入消息数组
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是助手"],
  new MessagesPlaceholder("history"), // 动态注入消息数组
  ["human", "{input}"],
]);
```

**消息格式**

```typescript
const history = [
  { role: "human", content: "你好" },
  { role: "ai", content: "你好！有什么可以帮你的？" },
  { role: "human", content: "介绍一下 React" },
  { role: "ai", content: "React 是一个用于构建用户界面的 JavaScript 库..." },
];
```

### 2. Buffer Memory vs Window Memory

#### Buffer Memory（缓冲记忆）

**原理**：保存所有历史消息，不做任何处理

**优点**：
- ✅ 信息完整，不丢失任何细节
- ✅ 实现简单

**缺点**：
- ❌ Token 消耗随对话轮数线性增长
- ❌ 长对话会导致成本高昂

**成本分析**：

```
假设每条消息平均 50 tokens：

第 1 轮：50 tokens
第 2 轮：150 tokens
第 3 轮：250 tokens
第 10 轮：2,750 tokens

成本呈二次方增长！💸
```

**适用场景**：
- 对话轮数少（< 5 轮）
- 需要完整上下文的场景

#### Window Memory（滑动窗口记忆）

**原理**：只保留最近 N 条消息，丢弃更早的消息

**优点**：
- ✅ Token 消耗固定
- ✅ 适合长对话场景

**缺点**：
- ❌ 会丢失早期信息

**成本分析**：

```
假设窗口大小为 4 条消息，每条 50 tokens：

第 1 轮：50 tokens
第 2 轮：150 tokens
第 3 轮：250 tokens
第 4 轮：350 tokens
第 5 轮：350 tokens（固定！）
第 10 轮：350 tokens（固定！）

成本固定，不再增长！💰
```

**窗口大小选择指南**：

| 窗口大小 | 适用场景 | Token 消耗 |
|---------|---------|-----------|
| 2 条消息 | 简单问答 | ~100 tokens |
| 4 条消息 | 一般对话 | ~200 tokens |
| 6 条消息 | 复杂讨论 | ~300 tokens |
| 10 条消息 | 深度对话 | ~500 tokens |

### 3. Summary Memory（摘要记忆）

**原理**：使用 LLM 将历史对话压缩成摘要

**优点**：
- ✅ 可以保留长期信息
- ✅ Token 消耗可控

**缺点**：
- ❌ 摘要可能丢失细节
- ❌ 需要额外的 LLM 调用

**工作流程**：

```
初始状态（前 9 轮）：
[消息1, 消息2, ..., 消息18]

触发摘要（第 10 轮）：
1. 调用 LLM 生成摘要："用户询问了性能优化..."
2. 保留最近 2 条消息
3. 新状态：[摘要, 消息18, 消息19, 消息20]

继续对话（第 11-19 轮）：
[摘要, 消息18, ..., 消息38]

再次触发摘要（第 20 轮）：
1. 更新摘要："用户学习了性能优化..."
2. 保留最近 2 条消息
3. 新状态：[新摘要, 消息38, 消息39, 消息40]
```

### 4. Vector Memory（向量记忆）

**原理**：将关键信息向量化存储，按需语义检索

**优点**：
- ✅ 支持长期记忆
- ✅ 语义检索相关信息

**缺点**：
- ❌ 需要向量数据库
- ❌ 实现复杂

**检索流程**：

```
1. 用户提问："推荐一个布局方案"
2. 将问题转换为向量
3. 在向量数据库中检索相似的事实卡片
4. 找到："用户偏好：暗色主题"、"学习历史：React"
5. 将相关事实注入到 Prompt 中
6. LLM 基于事实生成个性化回答
```

---

## 💻 代码示例详解

### 案例 1：MessagesPlaceholder 基础

**文件**：[basic-placeholder.ts](./basic-placeholder.ts)

**核心代码**：

```typescript
// 1. 创建包含历史消息占位符的 Prompt 模板
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是简洁的前端顾问"],
  new MessagesPlaceholder("history"), // 🔑 关键：历史消息占位符
  ["human", "{input}"],
]);

// 2. 构建处理链
const model = new ChatOpenAI({ temperature: 0 });
const chain = prompt.pipe(model).pipe(new StringOutputParser());

// 3. 调用时传入历史消息
const history = [
  { role: "human", content: "我们刚讨论了首屏优化" },
  { role: "ai", content: "首屏优化主要包括..." },
];

const answer = await chain.invoke({
  history,  // 历史消息数组
  input: "继续说说图片优化"  // 当前输入
});
```

**执行流程**：

```
1. 用户输入："继续说说图片优化"
2. 加载历史消息：[用户: "我们刚讨论了首屏优化", AI: "首屏优化主要包括..."]
3. 组装 Prompt：
   系统：你是简洁的前端顾问
   用户：我们刚讨论了首屏优化
   AI：首屏优化主要包括...
   用户：继续说说图片优化
4. 调用 LLM
5. 返回结果
```

**运行示例**：

```bash
npm run memory:basic-placeholder
```

---

### 案例 2：滑动窗口记忆

**文件**：[window-buffer.ts](./window-buffer.ts)

**核心代码**：

```typescript
// 1. 创建消息历史存储
const messageHistory = new InMemoryChatMessageHistory();

// 2. 手动实现滑动窗口：只保留最近 4 条消息
async function getWindowedHistory() {
  const messages = await messageHistory.getMessages();
  return messages.slice(-4); // 🔑 关键：只取最后 4 条
}

// 3. 构建带记忆的处理链
const chain = RunnableSequence.from([
  // 步骤 1：加载历史消息（滑动窗口）
  async (input: { input: string }) => {
    const history = await getWindowedHistory();
    return { input: input.input, history };
  },

  // 步骤 2：填充 Prompt 并调用模型
  prompt,
  model,
]);

// 4. 提问函数
async function ask(q: string) {
  await messageHistory.addUserMessage(q); // 保存用户消息
  const res = await chain.invoke({ input: q });
  await messageHistory.addAIMessage(res.content); // 保存 AI 消息
  return res;
}
```

**执行流程**：

```
对话轮次     内存中的消息                    窗口内的消息
第 1 轮    [消息1, 消息2]                  [消息1, 消息2]
第 2 轮    [消息1, 消息2, 消息3, 消息4]    [消息1, 消息2, 消息3, 消息4]
第 3 轮    [消息1, 消息2, ..., 消息6]      [消息3, 消息4, 消息5, 消息6]
           ↑                               ↑
           所有消息                         只有最近 4 条
```

**运行示例**：

```bash
npm run memory:window-buffer
```

---

### 案例 3：摘要记忆

**文件**：[summary.ts](./summary.ts)

**核心代码**：

```typescript
// 1. 摘要记忆管理器
class SummaryMemoryManager {
  private messageHistory: InMemoryChatMessageHistory;
  private summary: string = "";
  private summaryThreshold: number = 10; // 触发摘要的阈值
  private keepRecentCount: number = 2;   // 保留的最近消息数

  // 2. 生成摘要
  private async generateSummary(): Promise<string> {
    const messages = await this.messageHistory.getMessages();

    // 将消息转换为文本
    const historyText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    // 调用 LLM 生成摘要
    const summaryPrompt = `请将以下对话历史压缩为简洁的摘要：\n\n${historyText}\n\n摘要：`;
    const response = await this.llm.invoke(summaryPrompt);
    return response.content;
  }

  // 3. 获取历史（包含摘要和最近消息）
  async getHistory(): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.messageHistory.getMessages();

    // 如果消息很多，生成摘要
    if (messages.length > this.summaryThreshold) {
      this.summary = await this.generateSummary();

      // 清空旧消息，只保留最近几条
      const recentMessages = messages.slice(-this.keepRecentCount);
      await this.messageHistory.clear();

      for (const msg of recentMessages) {
        // 重新添加最近的消息
        if (msg.role === "human") {
          await this.messageHistory.addUserMessage(msg.content);
        } else {
          await this.messageHistory.addAIMessage(msg.content);
        }
      }
    }

    const result = [];

    // 先添加摘要
    if (this.summary) {
      result.push({ role: "system", content: `历史摘要：${this.summary}` });
    }

    // 再添加最近的消息
    const currentMessages = await this.messageHistory.getMessages();
    currentMessages.forEach(msg => {
      result.push({ role: msg.role, content: msg.content });
    });

    return result;
  }
}
```

**执行流程**：

```
初始状态（前 9 轮）：
┌────────────────────────────────────────┐
│ [消息1, 消息2, ..., 消息18]             │
│ 总共 18 条消息（9 轮对话）              │
└────────────────────────────────────────┘

第 10 轮（触发摘要）：
┌────────────────────────────────────────┐
│ 1. 生成摘要："用户询问了性能优化..."   │
│ 2. 清空旧消息                          │
│ 3. 保留最近 2 条消息                   │
└────────────────────────────────────────┘
                ↓
┌────────────────────────────────────────┐
│ [摘要, 消息18, 消息19, 消息20]         │
│ 总共 4 条（摘要 + 3 条消息）            │
└────────────────────────────────────────┘
```

**运行示例**：

```bash
npm run memory:summary
```

---

### 案例 4：向量记忆

**文件**：[vector-memory.ts](./vector-memory.ts)

**核心代码**：

```typescript
// 1. 模拟向量检索器（实际生产环境使用 Chroma/Pinecone/Qdrant）
class FakeRetriever implements BaseRetriever {
  async getRelevantDocuments(query: string) {
    // 模拟检索结果：根据查询返回相关事实
    const facts = [
      { pageContent: `用户偏好：更喜欢暗色主题；最近关注"响应式布局"` },
      { pageContent: `用户历史：之前询问过 React Hooks 和 TypeScript 相关问题` },
    ];

    // 根据查询内容过滤
    if (query.includes("主题") || query.includes("颜色")) {
      return facts.filter(f => f.pageContent.includes("暗色主题"));
    }

    return facts;
  }
}

// 2. 加载记忆：通过向量检索获取相关事实
async function loadVectorMemory(query: string) {
  const docs = await retriever.getRelevantDocuments(query);
  // 转换为消息格式
  return docs.map((doc) => ({
    role: "system" as const,
    content: doc.pageContent,
  }));
}

// 3. 构建处理链
const chain = RunnableSequence.from([
  // 步骤 1：加载记忆（通过向量检索）
  async (input: { input: string }) => {
    const history = await loadVectorMemory(input.input);
    return {
      input: input.input,
      history, // 检索到的相关事实
    };
  },

  // 步骤 2：填充 Prompt 并调用模型
  prompt,
  model,
]);
```

**运行示例**：

```bash
npm run memory:vector
```

---

### 案例 5：自定义 Memory

**文件**：[custom-memory.ts](./custom-memory.ts)

**核心代码**：

```typescript
// 定义 Memory 接口
interface BaseChatMemory {
  memoryKey: string;
  memoryKeys: string[];
  loadMemoryVariables(values: InputValues): Promise<Record<string, unknown>>;
  saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void>;
  clear(): Promise<void>;
}

// 自定义 Memory 实现
export class SimpleMemory implements BaseChatMemory {
  memoryKey = "history";
  private store: Record<string, Message[]> = {};

  constructor(private sessionId: string) {}

  get memoryKeys(): string[] {
    return [this.memoryKey];
  }

  // 加载记忆变量
  async loadMemoryVariables(_values: InputValues): Promise<Record<string, unknown>> {
    const messages = this.store[this.sessionId] || [];

    return {
      [this.memoryKey]: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
  }

  // 保存上下文
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

  // 清空记忆
  async clear(): Promise<void> {
    this.store[this.sessionId] = [];
  }
}
```

**运行示例**：

```bash
npm run memory:custom
```

---

### 案例 6：Redis 持久化

**文件**：[redis-memory.ts](./redis-memory.ts)

**核心代码**：

```typescript
// Redis Memory 实现
export class RedisMemory implements BaseChatMemory {
  memoryKey = "history";

  constructor(
    private client: RedisClient,
    private sessionId: string,
    private ttl: number = 60 * 60 * 24 // 默认 24 小时过期
  ) {}

  // 获取 Redis 键名
  private getKey(): string {
    return `mem:${this.sessionId}`;
  }

  // 加载记忆变量
  async loadMemoryVariables(_values: InputValues): Promise<Record<string, unknown>> {
    try {
      const raw = await this.client.get(this.getKey());
      if (!raw) {
        return { [this.memoryKey]: [] };
      }

      const messages = JSON.parse(raw);
      return {
        [this.memoryKey]: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      };
    } catch (error) {
      console.error("Redis 读取失败:", error);
      return { [this.memoryKey]: [] }; // 容错：返回空记忆
    }
  }

  // 保存上下文
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
}
```

**使用示例**：

```typescript
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const memory = new RedisMemory(client, "session-001", 60 * 60 * 24);
await memory.saveContext({ input: "你好" }, { content: "你好！" });
```

**运行示例**：

```bash
npm run memory:redis
```

---

### 案例 7：多会话隔离

**文件**：[session-chain.ts](./session-chain.ts)

**核心代码**：

```typescript
// 创建会话链工厂函数
export function createSessionChain(sessionId: string) {
  // 为每个会话创建独立的 Memory
  const memory = new SimpleMemory(sessionId);

  // 创建 Prompt 模板
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "你是稳健的技术助手"],
    new MessagesPlaceholder("history"),
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
    async (out: string, config?: any) => {
      const originalInput = config?.configurable?.input?.input || "";
      await memory.saveContext({ input: originalInput }, { content: out });
      return out;
    },
  ]);
}
```

**使用示例**：

```typescript
// 创建两个不同的会话
const session1 = createSessionChain("user-001");
const session2 = createSessionChain("user-002");

// 会话 1
await session1.invoke({ input: "什么是 React？" });

// 会话 2（独立的上下文）
await session2.invoke({ input: "什么是 Vue？" });
```

**运行示例**：

```bash
npm run memory:session-chain
```

---

### 案例 8：Callback 观测

**文件**：[memory-callback.ts](./memory-callback.ts)

**核心代码**：

```typescript
// 创建带 Callback 的模型
const model = new ChatOpenAI({
  callbacks: [new ConsoleCallbackHandler()], // 控制台回调
  verbose: true, // 启用详细日志
  temperature: 0,
});

// 构建处理链
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
    return output;
  },
]);
```

**运行示例**：

```bash
npm run memory:callback
```

---

### 案例 9：LangGraph 集成

**文件**：[langgraph-memory.ts](./langgraph-memory.ts)

**核心代码**：

```typescript
// 图状态类型定义
type GraphState = {
  history: Array<{ role: string; content: string }>;
  input: string;
  output?: string;
};

// 简化的状态图实现
export class SimpleStateGraph {
  private state: GraphState;

  constructor(initialState: Partial<GraphState> = {}) {
    this.state = {
      history: [],
      input: "",
      ...initialState,
    };
  }

  // LLM 节点：处理用户输入并更新历史
  async llmNode(input: string): Promise<string> {
    // 更新状态
    this.state.input = input;

    // 创建 Prompt（包含历史）
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "你是技术助手"],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);

    // 调用模型
    const model = new ChatOpenAI({ temperature: 0 });
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const output = await chain.invoke({
      history: this.state.history,
      input: this.state.input,
    });

    // 更新状态
    this.state.output = output;
    this.state.history.push(
      { role: "human", content: input },
      { role: "ai", content: output }
    );

    return output;
  }
}
```

**运行示例**：

```bash
npm run memory:langgraph
```

---

## 🎯 实战项目

### 项目 1：多用户会话中心

**文件**：[multi-session-center/server.ts](./multi-session-center/server.ts)

**功能**：
- ✅ 支持多租户、多用户、多会话
- ✅ Redis 持久化 Memory
- ✅ 流式响应
- ✅ 错误处理和容错

**核心功能**：

#### 1. 会话管理器

```typescript
export class SessionManager {
  constructor(
    private client: RedisClient,
    private defaultTtl: number = 60 * 60 * 24 * 7 // 默认 7 天过期
  ) {}

  // 获取会话键（三层隔离）
  private getSessionKey(tenantId: string, userId: string, sessionId: string): string {
    return `session:${tenantId}:${userId}:${sessionId}`;
  }

  // 加载会话历史
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

  // 保存消息到会话
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
    }
  }
}
```

#### 2. 处理聊天请求

```typescript
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
```

#### 3. 流式响应

```typescript
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
```

**运行示例**：

```bash
npm run memory:multi-session
```

---

### 项目 2：个性化学习助手

**文件**：[learning-assistant/orchestrator.ts](./learning-assistant/orchestrator.ts)

**功能**：
- ✅ 向量存储用户偏好、知识卡片、易错点
- ✅ 摘要压缩长期记忆
- ✅ 按需检索相关事实
- ✅ 阶段性摘要生成

**核心功能**：

#### 1. 学习助手编排器

```typescript
export class LearningAssistantOrchestrator {
  constructor(
    private vectorRetriever: VectorRetriever,
    private summaryStore: SummaryStore,
    private llm: ChatOpenAI
  ) {}

  // 检索长期记忆（向量检索）
  private async retrieveLongTermMemory(query: string, userId: string): Promise<FactCard[]> {
    return await this.vectorRetriever.getRelevantDocuments(query, userId);
  }

  // 加载或更新摘要
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

    return (await this.summaryStore.getSummary(userId)) || "";
  }

  // 构建 Prompt
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
}
```

#### 2. 编排处理流程

```typescript
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
  ]);
}
```

**运行示例**：

```bash
npm run memory:learning-assistant
```

---

## ❓ 常见问题

### Q1: 如何选择合适的 Memory 类型？

**决策树**：

```
对话轮数 < 5 轮？
  ├─ 是 → 使用 Buffer Memory
  └─ 否 → 继续

对话轮数 < 20 轮？
  ├─ 是 → 使用 Window Memory（窗口大小 4-6）
  └─ 否 → 继续

需要长期记忆？
  ├─ 是 → 使用 Summary Memory
  └─ 否 → 使用 Window Memory（窗口大小 10）

需要个性化？
  └─ 是 → 使用 Vector Memory + Summary Memory
```

**对比表**：

| Memory 类型 | 对话轮数 | Token 消耗 | 信息完整性 | 实现复杂度 | 适用场景 |
|------------|---------|-----------|-----------|-----------|---------|
| Buffer | < 5 | 高 | 100% | 低 | 简单问答 |
| Window | 5-20 | 中 | 部分 | 低 | 一般对话 |
| Summary | 20+ | 中 | 较高 | 中 | 长对话 |
| Vector | 不限 | 低 | 按需 | 高 | 个性化 |

### Q2: Memory 数据丢失怎么办？

**问题场景**：

```typescript
// 问题：服务重启后，内存中的 Memory 丢失
const memory = new InMemoryChatMessageHistory();
// 服务重启 → memory 清空 ❌
```

**解决方案**：

1. **使用 Redis 持久化**：
   ```typescript
   const redis = new Redis();
   const sessionManager = new SessionManager(redis);
   // 服务重启 → Redis 中的数据仍然存在 ✅
   ```

2. **定期备份到数据库**：
   ```typescript
   setInterval(async () => {
     const messages = await memory.getMessages();
     await db.save(sessionId, messages);
   }, 10 * 60 * 1000); // 每 10 分钟备份一次
   ```

### Q3: Token 消耗过大怎么优化？

**问题场景**：

```
对话 10 轮后，每次调用消耗 2000+ tokens
成本 = $0.002 × 2000 / 1000 = $0.004 / 次
如果每天 10000 次调用 = $40 / 天 💸
```

**优化方案**：

1. **使用 Window Memory**：
   ```typescript
   const history = messages.slice(-4);
   // Token 消耗固定在 ~200 tokens
   ```

2. **使用 Summary Memory**：
   ```typescript
   const summary = await generateSummary(messages);
   // 摘要 100 tokens + 最近 2 条消息 100 tokens = 200 tokens
   ```

3. **按需加载历史**：
   ```typescript
   if (needsContext(question)) {
     const history = await loadHistory();
   } else {
     const history = []; // 不加载历史
   }
   ```

### Q4: 如何处理多用户并发？

**问题场景**：

```
1000 个用户同时发送消息
→ 1000 次 Redis 读取
→ 1000 次 LLM 调用
→ 服务器压力大 😰
```

**解决方案**：

1. **使用消息队列**：
   ```typescript
   await queue.add({
     tenantId,
     userId,
     sessionId,
     message,
   });
   ```

2. **批量处理**：
   ```typescript
   const histories = await redis.mget([
     `session:${tenantId}:${userId1}:${sessionId1}`,
     `session:${tenantId}:${userId2}:${sessionId2}`,
   ]);
   ```

3. **缓存热点数据**：
   ```typescript
   const cache = new Map();

   async function loadHistory(sessionId) {
     if (cache.has(sessionId)) {
       return cache.get(sessionId);
     }

     const history = await redis.get(sessionId);
     cache.set(sessionId, history);
     return history;
   }
   ```

---

## 🎓 最佳实践

### 1. Memory 设计原则

**原则 1：按需加载**

```typescript
// ❌ 不推荐：总是加载所有历史
const history = await loadAllHistory(sessionId);

// ✅ 推荐：根据问题类型决定是否加载历史
if (isContextDependent(question)) {
  const history = await loadHistory(sessionId);
} else {
  const history = []; // 不需要历史
}
```

**原则 2：分层存储**

```
短期记忆（Redis）
  - 最近 10 轮对话
  - 快速读写
  - 7 天过期

中期记忆（MongoDB）
  - 历史摘要
  - 持久化存储
  - 支持查询

长期记忆（向量数据库）
  - 用户画像
  - 知识卡片
  - 语义检索
```

**原则 3：容错设计**

```typescript
// 即使 Memory 加载失败，也不应该中断服务
async function loadHistory(sessionId: string) {
  try {
    return await redis.get(sessionId);
  } catch (error) {
    console.error("加载历史失败:", error);
    return []; // 返回空数组，继续服务
  }
}
```

### 2. 安全性建议

**数据隔离**：

```typescript
// 使用三层隔离模型
const sessionKey = `session:${tenantId}:${userId}:${sessionId}`;

// 验证权限
if (!hasPermission(userId, sessionId)) {
  throw new Error("无权访问该会话");
}
```

**敏感信息过滤**：

```typescript
function filterSensitiveInfo(message: string): string {
  return message
    .replace(/\d{11}/g, "***********") // 手机号
    .replace(/\d{15,18}/g, "******************") // 身份证号
    .replace(/\d{16}/g, "****************"); // 银行卡号
}
```

### 3. 监控与告警

**关键指标**：

```typescript
// 1. Memory 大小
const memorySize = await redis.memory("usage", sessionKey);
if (memorySize > 1024 * 1024) { // 1MB
  console.warn("会话数据过大:", sessionId);
}

// 2. 响应时间
const start = Date.now();
const response = await chat(question);
const duration = Date.now() - start;
metrics.record("chat_duration", duration);

// 3. 错误率
try {
  await chat(question);
  metrics.increment("chat_success");
} catch (error) {
  metrics.increment("chat_error");
  throw error;
}
```

---

## 📚 参考资源

### 官方文档

- [LangChain.js 官方文档](https://js.langchain.com/)
- [LangChain Memory 指南](https://js.langchain.com/docs/modules/memory/)
- [OpenAI API 文档](https://platform.openai.com/docs)

### 相关文章

- [Building Conversational AI with Memory](https://blog.langchain.dev/memory/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Vector Databases for LLM Applications](https://www.pinecone.io/learn/vector-database/)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

**如何贡献**：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "Add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

## 📄 许可证

ISC License

---

**祝学习愉快！如有问题，欢迎提 Issue 讨论。** 🎉
