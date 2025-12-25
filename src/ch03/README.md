# 第3章：Memory 系统与对话状态管理 - 完整指南

> 系统理解 LangChain.js 的 Memory 体系，掌握短期/长期/摘要/向量记忆等多种方案，实现可观测、可持久化的对话系统。

---

## 📚 目录

- [为什么需要 Memory？](#为什么需要-memory)
- [Memory 类型详解](#memory-类型详解)
- [基础示例](#基础示例)
- [进阶集成](#进阶集成)
- [实战项目](#实战项目)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)

---

## 🤔 为什么需要 Memory？

### 语言模型的"无状态"特性

**核心问题**：语言模型本身是"无状态"的，每次调用只依赖输入的 Prompt。

**实际场景**：
```
用户："我们刚才讨论了什么？"
模型："我不知道，因为我没有记忆。"
```

**解决方案**：Memory 系统在多轮对话间传递"压缩过的语义"与"关键事实"。

### Memory 的本质

Memory 的本质是在多轮对话间传递信息：

1. **短期记忆**：最近几轮对话的完整内容
2. **长期记忆**：压缩后的摘要或关键事实
3. **事实记忆**：用户偏好、知识卡片等结构化信息

### 典型架构

```
用户请求
  ↓
会话控制器 (Session)
  ↓
Memory 管理器
  ├─ 短期：Buffer/Window
  ├─ 长期：Summary/Vector
  ├─ 持久化：Redis/Mongo
  └─ 观测：日志/回放/评分
  ↓
Prompt 模板（MessagesPlaceholder 注入）
  ↓
模型
  ↓
输出
  ↓
回写 Memory
```

---

## 📖 Memory 类型详解

### 1. Buffer（对话缓冲）

**特点**：
- ✅ 全量保留近几轮消息
- ✅ 简单直接，信息完整
- ❌ Token 膨胀，成本升高
- ❌ 响应变慢

**适用场景**：
- 对话轮数较少（< 10 轮）
- 需要完整上下文
- 成本不敏感

**代码示例**：

```typescript
import { ConversationBufferMemory } from "langchain/memory";

const memory = new ConversationBufferMemory({
  memoryKey: "history",
  returnMessages: true,
});
```

### 2. Buffer Window（滑动窗口）

**特点**：
- ✅ 仅保留最近 N 条，降低 token
- ✅ 控制成本
- ❌ 忘记早期但仍重要的信息

**适用场景**：
- 对话轮数较多
- 只需要最近几轮的上下文
- 成本敏感

**代码示例**：

```typescript
import { ConversationBufferWindowMemory } from "langchain/memory";

const memory = new ConversationBufferWindowMemory({
  k: 4, // 只保留最近 4 条消息
  memoryKey: "history",
  returnMessages: true,
});
```

**权衡**：
- `k=2`：成本最低，但上下文很少
- `k=4`：平衡成本和上下文（推荐）
- `k=8`：上下文更多，但成本较高

### 3. Summary（摘要记忆）

**特点**：
- ✅ 用模型将历史压缩成"摘要"
- ✅ 可以保留长期信息
- ✅ 控制 token 数量
- ❌ 摘要偏差、信息丢失
- ❌ 需要定期重新生成

**适用场景**：
- 需要长期记忆但对话轮数很多
- 需要保留关键信息但成本敏感
- 可以接受部分信息丢失

**代码示例**：

```typescript
import { ConversationSummaryMemory } from "langchain/memory";

const memory = new ConversationSummaryMemory({
  llm: new ChatOpenAI(),
  memoryKey: "history",
  returnMessages: true,
});
```

**工作原理**：
1. 初始：保存完整对话
2. 达到阈值：使用 LLM 生成摘要
3. 后续：摘要 + 最近几轮对话

### 4. Vector Store Memory（向量记忆）

**特点**：
- ✅ 将对话事实向量化存储
- ✅ 按需检索（近似语义匹配）
- ✅ 适合存储用户偏好、长期知识
- ❌ 召回误差
- ❌ 相似度阈值选择困难
- ❌ 向量库运维成本

**适用场景**：
- 个性化助手（用户偏好）
- 知识库问答（长期事实）
- 学习助手（学习记录）

**代码示例**：

```typescript
import { VectorStoreRetrieverMemory } from "langchain/memory";

const memory = new VectorStoreRetrieverMemory({
  retriever: vectorStore.asRetriever(),
  memoryKey: "history",
});
```

---

## 💻 基础示例

### 示例 1：MessagesPlaceholder 基础使用

**文件**：`basic-placeholder.ts`

**核心概念**：
- `MessagesPlaceholder` 是占位符，用于在 Prompt 中注入历史消息
- 历史消息可以从 Memory 系统加载

**代码**：

```typescript
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是简洁的前端顾问。"],
  new MessagesPlaceholder("history"), // 历史消息占位符
  ["human", "{input}"],
]);
```

**运行**：

```bash
npm run memory:basic-placeholder
```

### 示例 2：滑动窗口记忆

**文件**：`window-buffer.ts`

**演示**：
- 只保留最近 4 条消息
- 超过窗口的消息会被自动移除

**运行**：

```bash
npm run memory:window-buffer
```

### 示例 3：摘要记忆

**文件**：`summary.ts`

**演示**：
- 自动压缩历史对话
- 保留关键信息

**运行**：

```bash
npm run memory:summary
```

### 示例 4：向量记忆

**文件**：`vector-memory.ts`

**演示**：
- 通过语义检索召回相关事实
- 适合个性化场景

**运行**：

```bash
npm run memory:vector
```

### 示例 5：自定义 Memory

**文件**：`custom-memory.ts`

**演示**：
- 实现 `BaseChatMemory` 接口
- 自定义存储方式

**运行**：

```bash
npm run memory:custom
```

---

## 🔗 进阶集成

### 1. 与 Runnable 集成

**文件**：`session-chain.ts`

**特点**：
- 每个会话有独立的 Memory
- 链可以复用，但记忆是隔离的

**代码**：

```typescript
export function createSessionChain(sessionId: string) {
  const memory = new SimpleMemory(sessionId);
  
  return RunnableSequence.from([
    async (input) => ({
      input: input.input,
      history: await memory.loadMemoryVariables({})["history"],
    }),
    prompt,
    model,
    async (out) => {
      await memory.saveContext(input, { content: out });
      return out;
    },
  ]);
}
```

### 2. 与 Callback 集成

**文件**：`memory-callback.ts`

**用途**：
- 监控 Memory 的加载和保存
- 记录 token 使用情况
- 调试对话流程

**代码**：

```typescript
const model = new ChatOpenAI({
  callbacks: [new ConsoleCallbackHandler()],
  verbose: true,
});
```

### 3. 与 LangGraph 集成

**文件**：`langgraph-memory.ts`

**特点**：
- 将 Memory 作为状态的一部分
- 在节点间共享

**代码**：

```typescript
type GraphState = {
  history: Array<{ role: string; content: string }>;
  input: string;
  output?: string;
};
```

---

## 🚀 实战项目

### 项目一：多用户会话中心

**目录**：`multi-session-center/`

**功能**：
- ✅ 支持多用户、多会话
- ✅ Redis 持久化 Memory
- ✅ 流式响应
- ✅ 错误处理

**核心代码**：

```typescript
// 会话键格式：session:{tenantId}:{userId}:{sessionId}
const key = `session:${tenantId}:${userId}:${sessionId}`;

// 加载历史
const history = await client.get(key);

// 保存消息
await client.set(key, JSON.stringify(messages), { EX: 60 * 60 * 24 * 7 });
```

**使用**：

```typescript
import { SessionManager, handleChatRequest } from "./multi-session-center/server";

const sessionManager = new SessionManager(redisClient);

const response = await handleChatRequest(
  sessionManager,
  "tenant-001",
  "user-001",
  "session-001",
  "你好"
);
```

**运行**：

```bash
npm run memory:multi-session
```

### 项目二：个性化学习助手

**目录**：`learning-assistant/`

**功能**：
- ✅ 向量存储用户偏好、知识卡片、易错点
- ✅ 摘要压缩长期记忆
- ✅ 按需检索相关事实
- ✅ 阶段性摘要生成

**核心流程**：

```
1. 上下文收集（加载用户信息）
   ↓
2. 检索长期记忆（向量检索）
   ↓
3. 历史摘要（短期→长期压缩）
   ↓
4. Prompt 组装
   ↓
5. LLM 调用
   ↓
6. 回写与打分
```

**使用**：

```typescript
import { LearningAssistantOrchestrator } from "./learning-assistant/orchestrator";

const orchestrator = new LearningAssistantOrchestrator(
  vectorRetriever,
  summaryStore,
  llm
);

const chain = orchestrator.createOrchestrator();
const result = await chain.invoke({
  q: "请推荐首页布局方案",
  userId: "user-001",
});
```

**运行**：

```bash
npm run memory:learning-assistant
```

---

## 🔧 持久化方案

### Redis 持久化

**文件**：`redis-memory.ts`

**特点**：
- ✅ 持久化到 Redis，进程重启后不丢失
- ✅ 支持过期时间（TTL）
- ✅ 支持多会话隔离
- ✅ 适合生产环境

**使用**：

```typescript
import { RedisMemory } from "./redis-memory";
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const memory = new RedisMemory(client, "session-001", 60 * 60 * 24);
```

**数据结构**：

```
键：mem:session-001
值：JSON 数组
[
  { role: "human", content: "你好", ts: 1234567890 },
  { role: "ai", content: "你好！", ts: 1234567891 }
]
```

### MongoDB 持久化

**实现思路**：

```typescript
// 1. 定义 Schema
const sessionSchema = {
  sessionId: String,
  messages: [{
    role: String,
    content: String,
    timestamp: Number,
  }],
  createdAt: Date,
  updatedAt: Date,
};

// 2. 实现 Memory 接口
class MongoMemory implements BaseChatMemory {
  async loadMemoryVariables() {
    const doc = await db.sessions.findOne({ sessionId });
    return { history: doc?.messages || [] };
  }
  
  async saveContext(input, output) {
    await db.sessions.updateOne(
      { sessionId },
      { $push: { messages: { role: "human", content: input } } }
    );
  }
}
```

---

## 🛡️ 健壮性与安全

### 错误处理

**策略**：

1. **结构异常**：Memory 读写失败 → 回退到空历史 + 记录错误
2. **消息去重**：哈希或指纹，避免重复注入
3. **冲突处理**：同一轮内多次写入按时间戳排序、幂等化

**代码示例**：

```typescript
async loadMemoryVariables() {
  try {
    const raw = await this.client.get(key);
    return JSON.parse(raw);
  } catch (error) {
    console.error("Memory 加载失败:", error);
    // 容错：返回空历史
    return { history: [] };
  }
}
```

### 隐私与合规

**最小化原则**：
- 仅保存任务所需的最少内容
- 定期清理过期数据

**数据脱敏**：
- PII/敏感字段脱敏或只保留摘要/向量
- 不在日志中输出完整对话

**可删除权**：
- 支持会话级清除
- 支持用户级清除

**访问控制**：
- 会话隔离
- 租户隔离
- 审计日志

---

## 📊 性能优化

### 1. 检索优化

**建议**：
- ✅ 使用 Window 作为短期记忆
- ✅ 使用 Summary/Vector 作为长期记忆
- ✅ 阶段性摘要：按对话轮数或 token 阈值触发
- ✅ 检索前过滤：基于关键词/规则初筛

**代码示例**：

```typescript
// 每 10 轮对话生成一次摘要
if (conversationHistory.length % 10 === 0) {
  const summary = await generateSummary(conversationHistory);
  await summaryStore.updateSummary(userId, summary);
}
```

### 2. 结果去重

**策略**：
- 相似度去重：计算消息相似度，过滤重复
- 标题指纹：提取关键信息，避免重复注入

**代码示例**：

```typescript
function deduplicateMessages(messages: Message[]): Message[] {
  const seen = new Set<string>();
  return messages.filter((msg) => {
    const hash = hashMessage(msg.content);
    if (seen.has(hash)) {
      return false;
    }
    seen.add(hash);
    return true;
  });
}
```

### 3. 缓存策略

**会话级缓存**：
- Prompt 模板缓存
- 检索结果缓存

**代码示例**：

```typescript
const promptCache = new Map<string, string>();

function getCachedPrompt(template: string, variables: Record<string, unknown>): string {
  const key = `${template}:${JSON.stringify(variables)}`;
  if (promptCache.has(key)) {
    return promptCache.get(key)!;
  }
  const prompt = formatPrompt(template, variables);
  promptCache.set(key, prompt);
  return prompt;
}
```

---

## 🧪 测试与可观测性

### 回归测试

**构建测试用例**：

```typescript
const testCases = [
  {
    name: "多轮对话连续性",
    steps: [
      { input: "什么是 React？", expected: "包含 React" },
      { input: "它有什么优势？", expected: "引用 React" },
    ],
  },
  {
    name: "历史回忆",
    steps: [
      { input: "我们讨论了性能优化", expected: "确认" },
      { input: "之前聊过什么？", expected: "提到性能优化" },
    ],
  },
];
```

### 可观测性

**Callback 记录**：

```typescript
const callback = {
  onMemoryLoad: (count: number) => {
    console.log(`加载了 ${count} 条历史消息`);
  },
  onMemorySave: (message: Message) => {
    console.log(`保存了消息: ${message.role}`);
  },
};
```

**LangSmith 追踪**：

```typescript
import { LangChainTracer } from "langchain/callbacks";

const tracer = new LangChainTracer({
  projectName: "memory-system",
});

const chain = buildChain().withConfig({
  callbacks: [tracer],
});
```

---

## 📖 使用指南

### 快速开始

#### 1. 基础使用

```typescript
import { ConversationBufferWindowMemory } from "langchain/memory";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// 创建 Memory
const memory = new ConversationBufferWindowMemory({
  k: 4,
  memoryKey: "history",
  returnMessages: true,
});

// 创建 Prompt
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是助手"],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// 使用
const history = await memory.loadMemoryVariables({});
const response = await chain.invoke({ history: history.history, input: "你好" });
await memory.saveContext({ input: "你好" }, { output: response });
```

#### 2. 多会话管理

```typescript
import { SimpleMemory } from "./custom-memory";

// 为每个会话创建独立的 Memory
const session1 = new SimpleMemory("session-001");
const session2 = new SimpleMemory("session-002");

// 会话隔离
await session1.saveContext({ input: "React" }, { content: "..." });
await session2.saveContext({ input: "Vue" }, { content: "..." });
```

#### 3. Redis 持久化

```typescript
import { RedisMemory } from "./redis-memory";
import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const memory = new RedisMemory(client, "session-001", 60 * 60 * 24);
```

---

## 🎯 最佳实践

### 1. Memory 选择指南

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 短对话（< 10 轮） | Buffer | 信息完整，成本低 |
| 中等对话（10-50 轮） | Window (k=4) | 平衡成本和上下文 |
| 长对话（> 50 轮） | Summary + Window | 长期记忆 + 短期上下文 |
| 个性化场景 | Vector Store | 语义检索用户偏好 |
| 多用户生产环境 | Redis Memory | 持久化、可扩展 |

### 2. 成本控制

**策略**：
- 使用 Window 限制消息数量
- 定期生成摘要，清理旧消息
- 使用 GPT-3.5-turbo 生成摘要（比 GPT-4 便宜）

**代码示例**：

```typescript
// 每 10 轮对话生成摘要
if (messageCount % 10 === 0) {
  const summary = await generateSummary(history);
  // 清空历史，只保留摘要
  await memory.clear();
  await memory.saveContext({ input: summary }, { output: "" });
}
```

### 3. 性能优化

**建议**：
- 异步保存 Memory（不阻塞响应）
- 批量操作（减少 Redis 调用）
- 使用连接池（数据库连接）

**代码示例**：

```typescript
// 异步保存，不阻塞响应
Promise.all([
  memory.saveContext(input, output),
  // 其他异步操作
]).catch(err => console.error(err));
```

---

## 📚 相关资源

- [LangChain.js Memory 文档](https://js.langchain.com/docs/modules/memory/)
- [MessagesPlaceholder 使用](https://js.langchain.com/docs/modules/prompts/prompt_templates/)
- [LangGraph 状态图](https://langchain-ai.github.io/langgraph/)
- [Redis 官方文档](https://redis.io/docs/latest/)

---

## ✅ 本章小结

通过本章学习，你应该：

1. ✅ **理解 Memory 体系**：Buffer、Window、Summary、Vector 的优缺点
2. ✅ **掌握 MessagesPlaceholder**：如何在 Prompt 中注入历史
3. ✅ **实现持久化**：Redis/MongoDB 持久化方案
4. ✅ **集成其他组件**：Runnable、Callback、LangGraph
5. ✅ **完成实战项目**：多用户会话中心、个性化学习助手

**核心价值**：
- 🎯 **连续性**：前后语义一致、上下文连贯
- 💰 **经济性**：控制 token 成本
- 🛡️ **稳健性**：错误处理、去重、冲突处理
- 🔒 **安全性**：隐私保护、访问控制

---

**作者**: LangChain Tutorial Team  
**更新时间**: 2025-12-24  
**版本**: 1.0.0

---

## 📞 获取帮助

- 📖 查看代码注释了解详细实现
- 💬 遇到问题可以查看"最佳实践"部分
- 🔗 参考 [LangChain.js 官方文档](https://js.langchain.com/)

**祝你使用愉快！** 🎊

