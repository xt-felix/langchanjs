# Chapter 04: Callback 机制与事件驱动架构 📡

> 全面掌握 LangChain.js 的 Callback 体系，实现流式输出、进度上报、链路追踪与实时监控

## 📚 目录

- [什么是 Callback？](#什么是-callback)
- [为什么需要 Callback？](#为什么需要-callback)
- [快速开始](#快速开始)
- [核心概念详解](#核心概念详解)
- [代码示例详解](#代码示例详解)
- [实战项目](#实战项目)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

---

## 🎯 什么是 Callback？

### 核心问题

LLM 推理过程是一个"黑箱"，我们无法直接观察到：

```typescript
// ❌ 问题：我们看不到 LLM 内部发生了什么
const result = await model.invoke("解释虚拟 DOM");
// 等待 2 秒...
// 突然返回结果
// 中间过程完全不可见 😕
```

### 解决方案

Callback（回调）机制可以让我们监听和响应 LLM 执行过程中的各种事件：

```typescript
// ✅ 使用 Callback：可以观察整个执行过程
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

class MyHandler extends BaseCallbackHandler {
  name = "my-handler";

  // LLM 开始执行
  async handleLLMStart() {
    console.log("🚀 LLM 开始执行");
  }

  // 收到新的 Token（流式输出）
  async handleLLMNewToken(token: string) {
    process.stdout.write(token); // 打字机效果
  }

  // LLM 执行完成
  async handleLLMEnd(output) {
    console.log("\n✅ LLM 执行完成");
    console.log("Token 消耗:", output.llmOutput?.tokenUsage);
  }
}

const model = new ChatOpenAI({
  callbacks: [new MyHandler()], // 注入 Callback
});

await model.invoke("解释虚拟 DOM");
// 输出：
// 🚀 LLM 开始执行
// 虚拟DOM是... (逐字输出)
// ✅ LLM 执行完成
// Token 消耗: { total: 150, prompt: 20, completion: 130 }
```

### 项目结构

```
src/ch04/
├── console-callback.ts          # 🎯 基础：控制台回调快速上手
├── metrics-callback.ts          # 📊 自定义 CallbackHandler（指标收集）
├── with-metrics.ts              # 🔧 使用自定义 Callback
├── stream-cli.ts                # 📡 流式输出（打字机效果）
├── cancel.ts                    # 🛑 取消和超时控制
├── runnable-callback.ts         # 🔗 Runnable 回调融合（链路追踪）
├── realtime-chat/               # 🚀 实战：实时聊天系统
│   └── server.ts
└── README.md                    # 📖 本文档
```

---

## 🤔 为什么需要 Callback？

### 1. 可观测性：打开"黑箱"

**场景**：LLM 响应很慢，不知道是哪里出了问题

```
没有 Callback：
用户发送问题 → 等待 5 秒 → 返回结果
❌ 问题：不知道这 5 秒发生了什么

有 Callback：
用户发送问题
  → [0.1s] Prompt 格式化完成
  → [0.2s] LLM 开始执行
  → [0.2s - 4.8s] 逐个 Token 返回（可实时显示）
  → [4.9s] 解析输出
  → [5.0s] 返回结果
✅ 清楚地看到每个环节的耗时
```

### 2. 用户体验：流式输出（打字机效果）

**对比**：

```
非流式（等待完整结果）：
👤 用户："介绍 React"
⏳ 等待 3 秒...
🤖 AI："React 是一个用于构建用户界面的 JavaScript 库..."
❌ 感觉：等待时间长，体验差

流式（逐字输出）：
👤 用户："介绍 React"
🤖 AI："R"（立即开始显示）
🤖 AI："Re"
🤖 AI："Rea"
🤖 AI："React"
🤖 AI："React 是..."
✅ 感觉：立即看到响应，体验好
```

虽然总耗时相同，但流式输出让用户感觉更快！

### 3. 指标收集：成本与性能监控

```typescript
// 通过 Callback 收集关键指标
class MetricsHandler extends BaseCallbackHandler {
  async handleLLMEnd(output) {
    const usage = output.llmOutput?.tokenUsage;

    // 成本计算
    const cost = (usage.promptTokens * 0.0015 + usage.completionTokens * 0.002) / 1000;
    console.log(`本次调用成本: $${cost.toFixed(6)}`);

    // 性能监控
    const duration = Date.now() - this.startTime;
    console.log(`耗时: ${duration}ms`);
    console.log(`速度: ${usage.totalTokens / (duration / 1000)} tokens/s`);

    // 上报到监控系统
    metrics.record("llm_cost", cost);
    metrics.record("llm_duration", duration);
  }
}
```

### 4. 调试与追踪：定位问题

```typescript
// 通过 Callback 追踪完整链路
class DebugHandler extends BaseCallbackHandler {
  async handleChainStart(chain, inputs, runId, parentRunId) {
    console.log(`[Chain Start] ${chain.name}`);
    console.log(`  RunId: ${runId}`);
    console.log(`  ParentId: ${parentRunId}`);
    console.log(`  Inputs:`, inputs);
  }

  async handleChainEnd(outputs, runId) {
    console.log(`[Chain End] ${runId}`);
    console.log(`  Outputs:`, outputs);
  }
}

// 输出完整的调用链路，方便定位问题
```

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 确保已安装依赖
npm install

# 2. 配置 API Key
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

### 2. 运行第一个示例

```bash
# 运行控制台回调示例
npm run callback:console
```

**预期输出**：

```
╔════════════════════════════════════════════════════════════════╗
║       控制台回调演示：观察 LLM 执行过程                        ║
╚════════════════════════════════════════════════════════════════╝

📝 用户问题：解释虚拟列表（Virtualized List）

🔄 开始执行...

[LLM Start] gpt-3.5-turbo
[Chain Start] PromptTemplate
  Inputs: { topic: "虚拟列表（Virtualized List）" }
[Chain End] PromptTemplate

虚拟列表是一种优化技术，用于渲染大量数据时只渲染可见区域的内容...

[LLM End]
  Token Usage: { prompt: 25, completion: 120, total: 145 }
  Duration: 1850ms

✅ 最终输出：
虚拟列表是一种优化技术，用于渲染大量数据时只渲染可见区域的内容...
```

### 3. 运行其他示例

```bash
# 自定义 Callback（指标收集）
npm run callback:metrics

# 流式输出（打字机效果）
npm run callback:stream

# 取消和超时控制
npm run callback:cancel

# Runnable 回调融合（链路追踪）
npm run callback:runnable

# 实战：实时聊天系统
npm run callback:realtime-chat
```

---

## 🔍 核心概念详解

### 1. Callback 生命周期事件

LangChain.js 提供了丰富的回调钩子：

#### LLM 级别

```typescript
class MyHandler extends BaseCallbackHandler {
  // LLM 开始执行
  async handleLLMStart(llm, prompts, runId, parentRunId) {
    console.log("LLM 开始执行");
  }

  // 收到新的 Token（流式输出）
  async handleLLMNewToken(token, idx, runId) {
    process.stdout.write(token);
  }

  // LLM 执行完成
  async handleLLMEnd(output, runId) {
    console.log("LLM 执行完成");
  }

  // LLM 执行出错
  async handleLLMError(err, runId) {
    console.error("LLM 执行出错:", err);
  }
}
```

#### Chain/Runnable 级别

```typescript
class MyHandler extends BaseCallbackHandler {
  // Chain 开始执行
  async handleChainStart(chain, inputs, runId, parentRunId) {
    console.log("Chain 开始执行");
  }

  // Chain 执行完成
  async handleChainEnd(outputs, runId) {
    console.log("Chain 执行完成");
  }

  // Chain 执行出错
  async handleChainError(err, runId) {
    console.error("Chain 执行出错:", err);
  }
}
```

#### Tool 级别

```typescript
class MyHandler extends BaseCallbackHandler {
  // Tool 开始执行
  async handleToolStart(tool, input, runId) {
    console.log("Tool 开始执行");
  }

  // Tool 执行完成
  async handleToolEnd(output, runId) {
    console.log("Tool 执行完成");
  }

  // Tool 执行出错
  async handleToolError(err, runId) {
    console.error("Tool 执行出错:", err);
  }
}
```

### 2. Run 树：嵌套调用的追踪

当一个 Runnable 调用另一个 Runnable 时，会形成一棵调用树：

```
invoke (runId: A)
 ├─ Prompt.format (runId: B, parent: A)
 ├─ LLM.invoke (runId: C, parent: A)
 │   ├─ token#1
 │   ├─ token#2
 │   └─ ...
 └─ OutputParser.parse (runId: D, parent: A)
```

**如何使用？**

```typescript
class TreeTracer extends BaseCallbackHandler {
  private depth = 0;

  async handleChainStart(chain, inputs, runId, parentRunId) {
    const indent = "  ".repeat(this.depth);
    console.log(`${indent}┌─ [${chain.name}] (runId: ${runId.slice(0, 8)})`);
    if (parentRunId) {
      console.log(`${indent}│  父节点: ${parentRunId.slice(0, 8)}`);
    }
    this.depth++;
  }

  async handleChainEnd(outputs, runId) {
    this.depth--;
    const indent = "  ".repeat(this.depth);
    console.log(`${indent}└─ [完成] (runId: ${runId.slice(0, 8)})`);
  }
}

// 输出：
// ┌─ [RunnableSequence] (runId: 12345678)
//   ┌─ [PromptTemplate] (runId: 23456789)
//   │  父节点: 12345678
//   └─ [完成] (runId: 23456789)
//   ┌─ [ChatOpenAI] (runId: 34567890)
//   │  父节点: 12345678
//   └─ [完成] (runId: 34567890)
// └─ [完成] (runId: 12345678)
```

### 3. 流式输出 (Streaming)

**原理**：

```
非流式：
LLM 生成所有 Token → 一次性返回

流式：
LLM 生成 Token#1 → 立即返回
LLM 生成 Token#2 → 立即返回
LLM 生成 Token#3 → 立即返回
...
```

**代码实现**：

```typescript
// 1. 启用流式输出
const model = new ChatOpenAI({
  streaming: true, // 🔑 关键
});

// 2. 使用 stream() 方法
const stream = await model.stream("介绍 React");

// 3. 遍历流
for await (const chunk of stream) {
  process.stdout.write(chunk.content); // 打字机效果
}
```

**效果对比**：

| 指标           | 非流式           | 流式                 |
| -------------- | ---------------- | -------------------- |
| 首次响应延迟   | 2000ms           | 150ms ⚡             |
| 总耗时         | 2000ms           | 2000ms               |
| 用户体验       | 需要等待完整结果 | 立即看到响应 ✅      |
| 适用场景       | 批量处理         | 实时交互             |

### 4. 取消与超时

**为什么需要？**

1. 用户中途改变主意，不想等待
2. 请求超时，避免无限等待
3. 控制成本，避免不必要的 API 调用

**实现方式**：

```typescript
// 方式 1：使用 AbortController
const controller = new AbortController();

// 500ms 后取消
setTimeout(() => controller.abort(), 500);

const model = new ChatOpenAI();
try {
  await model.invoke("写一篇长文章", {
    signal: controller.signal, // 🔑 关键
  });
} catch (error) {
  if (error.name === "AbortError") {
    console.log("已取消");
  }
}

// 方式 2：设置超时时间
const model = new ChatOpenAI({
  timeout: 5000, // 5 秒超时
});
```

---

## 💻 代码示例详解

### 案例 1：控制台回调（快速上手）

**文件**：[console-callback.ts](./console-callback.ts)

**功能**：使用内置的详细日志模式观察 LLM 执行过程

**核心代码**：

```typescript
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  verbose: true, // 🔑 关键：启用详细日志
});

const chain = prompt.pipe(model).pipe(new StringOutputParser());
await chain.invoke({ topic: "虚拟列表" });
```

**运行示例**：

```bash
npm run callback:console
```

**学习要点**：
- `verbose: true` 自动打印执行日志
- 适合开发调试，快速了解执行过程
- 生产环境应使用自定义 Callback

---

### 案例 2：自定义 Callback（指标收集）

**文件**：[metrics-callback.ts](./metrics-callback.ts) + [with-metrics.ts](./with-metrics.ts)

**功能**：收集 Token 消耗、耗时、成本等指标

**核心代码**：

```typescript
// 1. 定义自定义 Callback
class MetricsHandler extends BaseCallbackHandler {
  name = "metrics-handler";
  private metrics = {
    llmCalls: 0,
    totalTokens: 0,
    errors: 0,
  };

  async handleLLMStart() {
    this.metrics.llmCalls++;
  }

  async handleLLMEnd(output) {
    const usage = output.llmOutput?.tokenUsage;
    this.metrics.totalTokens += usage.totalTokens || 0;
  }

  getMetrics() {
    return this.metrics;
  }
}

// 2. 使用自定义 Callback
const handler = new MetricsHandler();
await chain.invoke({ text: "Hello" }, {
  callbacks: [handler], // 🔑 注入 Callback
});

// 3. 获取指标
console.log(handler.getMetrics());
// 输出: { llmCalls: 1, totalTokens: 150, errors: 0 }
```

**运行示例**：

```bash
npm run callback:metrics
```

**学习要点**：
- 继承 `BaseCallbackHandler` 创建自定义 Callback
- 通过 `callbacks` 参数注入
- 可以在多次调用中累积指标
- 适合成本分析、性能监控

---

### 案例 3：流式输出（打字机效果）

**文件**：[stream-cli.ts](./stream-cli.ts)

**功能**：实现流式输出，逐字显示 AI 回答

**核心代码**：

```typescript
// 1. 启用流式输出
const model = new ChatOpenAI({
  streaming: true, // 🔑 关键
});

// 2. 使用 stream() 方法
const stream = await model.stream("介绍 LangChain.js");

// 3. 逐个输出 Token
for await (const chunk of stream) {
  process.stdout.write(chunk.content); // 打字机效果
}
```

**运行示例**：

```bash
npm run callback:stream
```

**学习要点**：
- `streaming: true` 启用流式输出
- 使用 `stream()` 代替 `invoke()`
- `for await...of` 遍历异步迭代器
- 显著降低首次响应延迟

---

### 案例 4：取消和超时

**文件**：[cancel.ts](./cancel.ts)

**功能**：实现请求取消和超时控制

**核心代码**：

```typescript
// 方式 1：AbortController
const controller = new AbortController();

setTimeout(() => controller.abort(), 500); // 500ms 后取消

try {
  await model.invoke("问题", {
    signal: controller.signal, // 🔑 关键
  });
} catch (error) {
  if (error.name === "AbortError") {
    console.log("已取消");
  }
}

// 方式 2：Model 级别超时
const model = new ChatOpenAI({
  timeout: 5000, // 5 秒超时
});
```

**运行示例**：

```bash
npm run callback:cancel
```

**学习要点**：
- 使用 `AbortController` 实现取消
- `signal` 参数传递取消信号
- `timeout` 参数设置超时时间
- 可以实现重试机制

---

### 案例 5：Runnable 回调融合（链路追踪）

**文件**：[runnable-callback.ts](./runnable-callback.ts)

**功能**：追踪 Runnable 执行链路，形成 Run 树

**核心代码**：

```typescript
class RunnableTracer extends BaseCallbackHandler {
  private depth = 0;

  async handleChainStart(chain, inputs, runId, parentRunId) {
    const indent = "  ".repeat(this.depth);
    console.log(`${indent}┌─ [${chain.name}] (runId: ${runId.slice(0, 8)})`);
    this.depth++;
  }

  async handleChainEnd(outputs, runId) {
    this.depth--;
    const indent = "  ".repeat(this.depth);
    console.log(`${indent}└─ [完成]`);
  }
}

const tracer = new RunnableTracer();
await chain.invoke({ input: "Hello" }, {
  callbacks: [tracer],
});
```

**输出示例**：

```
┌─ [RunnableSequence] (runId: 12345678)
  ┌─ [PromptTemplate] (runId: 23456789)
  │  父节点: 12345678
  └─ [完成]
  ┌─ [ChatOpenAI] (runId: 34567890)
  │  父节点: 12345678
  └─ [完成]
└─ [完成]
```

**运行示例**：

```bash
npm run callback:runnable
```

**学习要点**：
- 通过 `runId` 和 `parentRunId` 重建调用树
- 适合调试复杂链路
- 可以精准定位性能瓶颈

---

## 🎯 实战项目

### 项目：实时聊天系统

**文件**：[realtime-chat/server.ts](./realtime-chat/server.ts)

**功能特性**：

✅ 流式输出（打字机效果）
✅ 实时进度上报（Token 计数、耗时）
✅ 错误处理和重试
✅ 取消功能
✅ 指标收集（Token 消耗、成本估算）

**架构设计**：

```
┌─────────────────────────────────────────────────────────┐
│                      服务端                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  RealtimeChatHandler (Callback)                │    │
│  │  - handleLLMStart: 发送 start 事件            │    │
│  │  - handleLLMNewToken: 发送 token 事件         │    │
│  │  - handleLLMEnd: 发送 end 事件                │    │
│  └────────────────────────────────────────────────┘    │
│                      ↓ 事件流                           │
└─────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│                      客户端                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  ClientEventHandler                             │    │
│  │  - start: 显示"会话开始"                       │    │
│  │  - token: 逐字显示（打字机效果）               │    │
│  │  - progress: 更新进度条                        │    │
│  │  - end: 显示指标摘要                           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**核心实现**：

#### 1. 服务端：事件发送器

```typescript
class RealtimeChatHandler extends BaseCallbackHandler {
  constructor(private eventCallback: (event: ChatEvent) => void) {
    super();
  }

  async handleLLMStart() {
    this.eventCallback({
      type: "start",
      sessionId: "xxx",
      timestamp: Date.now(),
    });
  }

  async handleLLMNewToken(token: string) {
    this.eventCallback({
      type: "token",
      content: token,
      index: this.tokenCount++,
    });
  }

  async handleLLMEnd(output) {
    this.eventCallback({
      type: "end",
      totalTokens: output.llmOutput?.tokenUsage.totalTokens,
      duration: Date.now() - this.startTime,
      cost: this.calculateCost(output),
    });
  }
}
```

#### 2. 客户端：事件处理器

```typescript
class ClientEventHandler {
  handleEvent(event: ChatEvent) {
    switch (event.type) {
      case "start":
        console.log("🚀 会话开始");
        break;

      case "token":
        process.stdout.write(event.content); // 打字机效果
        break;

      case "progress":
        // 更新进度条
        break;

      case "end":
        console.log(`\n✅ 完成 (Token: ${event.totalTokens}, 成本: $${event.cost})`);
        break;
    }
  }
}
```

#### 3. 聊天服务

```typescript
class ChatService {
  async chat(question: string, eventCallback: (event: ChatEvent) => void) {
    const handler = new RealtimeChatHandler(eventCallback);
    await chain.invoke({ question }, { callbacks: [handler] });
  }
}

// 使用
const client = new ClientEventHandler();
const service = new ChatService();

await service.chat("介绍 React", (event) => client.handleEvent(event));
```

**运行示例**：

```bash
npm run callback:realtime-chat
```

**预期输出**：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 会话开始
   Session ID: abc1234
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 AI 回答（实时输出）：

React 是一个用于构建用户界面的 JavaScript 库...
(逐字显示，打字机效果)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 会话完成
   总 Token 数: 150
   耗时: 1850ms
   成本: $0.000285
   速度: 81.08 tokens/s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**在真实场景中的应用**：

1. **Next.js SSE 集成**：

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { question } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const handler = new RealtimeChatHandler((event) => {
        // 通过 SSE 推送事件
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      await chatService.chat(question, handler);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
```

2. **前端消费**：

```typescript
// 前端
const eventSource = new EventSource("/api/chat");

eventSource.onmessage = (e) => {
  const event = JSON.parse(e.data);

  if (event.type === "token") {
    setText((prev) => prev + event.content); // 打字机效果
  }
};
```

**学习要点**：
- 通过 Callback 实现事件驱动架构
- 模拟 SSE 推送（在真实场景中使用 SSE/WebSocket）
- 实现流式输出、进度上报、指标收集
- 支持取消、错误处理、重试机制

---

## ❓ 常见问题

### Q1: Callback 会影响性能吗？

**答**：

影响很小，因为：
1. Callback 是异步执行的，不会阻塞主流程
2. 大部分操作（如日志打印）都很轻量

**最佳实践**：

```typescript
// ❌ 不推荐：在 Callback 中执行耗时操作
class BadHandler extends BaseCallbackHandler {
  async handleLLMNewToken(token: string) {
    await fetch("/api/log", { method: "POST", body: token }); // 阻塞！
  }
}

// ✅ 推荐：使用队列批量处理
class GoodHandler extends BaseCallbackHandler {
  private queue: string[] = [];

  async handleLLMNewToken(token: string) {
    this.queue.push(token);

    // 每 10 个 Token 批量发送一次
    if (this.queue.length >= 10) {
      this.flushQueue(); // 异步发送，不阻塞
      this.queue = [];
    }
  }

  private flushQueue() {
    // 不等待结果，直接返回
    fetch("/api/log", {
      method: "POST",
      body: JSON.stringify(this.queue),
    }).catch(console.error);
  }
}
```

### Q2: 如何在流式输出时取消？

**答**：

```typescript
const controller = new AbortController();

// 用户点击"停止"按钮时
button.onclick = () => controller.abort();

// 流式输出
const stream = await model.stream("问题", {
  signal: controller.signal,
});

try {
  for await (const chunk of stream) {
    process.stdout.write(chunk.content);
  }
} catch (error) {
  if (error.name === "AbortError") {
    console.log("用户取消了");
  }
}
```

### Q3: 如何追踪嵌套的 Runnable？

**答**：

通过 `runId` 和 `parentRunId` 重建调用树：

```typescript
class TreeTracer extends BaseCallbackHandler {
  private tree: Map<string, { name: string; parent?: string }> = new Map();

  async handleChainStart(chain, inputs, runId, parentRunId) {
    this.tree.set(runId, {
      name: chain.name,
      parent: parentRunId,
    });
  }

  printTree() {
    // 找到根节点（没有 parent 的节点）
    const roots = Array.from(this.tree.entries())
      .filter(([_, node]) => !node.parent);

    // 递归打印树
    roots.forEach(([runId, node]) => {
      this.printNode(runId, 0);
    });
  }

  private printNode(runId: string, depth: number) {
    const node = this.tree.get(runId);
    console.log("  ".repeat(depth) + `- ${node.name}`);

    // 打印子节点
    Array.from(this.tree.entries())
      .filter(([_, n]) => n.parent === runId)
      .forEach(([childId, _]) => {
        this.printNode(childId, depth + 1);
      });
  }
}
```

### Q4: Callback 中的错误会被捕获吗？

**答**：

是的，LangChain 会捕获 Callback 中的错误，避免影响主流程：

```typescript
class ErrorHandler extends BaseCallbackHandler {
  async handleLLMNewToken(token: string) {
    // 即使这里抛出错误，也不会影响 LLM 执行
    throw new Error("Callback 错误");
  }
}

// LLM 仍然会正常执行
const result = await model.invoke("问题", {
  callbacks: [new ErrorHandler()],
});
// ✅ 成功返回结果，Callback 错误被捕获并打印
```

但建议自己处理错误：

```typescript
class SafeHandler extends BaseCallbackHandler {
  async handleLLMNewToken(token: string) {
    try {
      await this.processToken(token);
    } catch (error) {
      console.error("Callback 错误:", error);
      // 上报到监控系统
      errorReporter.report(error);
    }
  }
}
```

---

## 🎓 最佳实践

### 1. Callback 设计原则

#### 原则 1：快速响应

```typescript
// ❌ 不推荐：阻塞操作
async handleLLMNewToken(token: string) {
  await db.insert({ token }); // 阻塞 I/O
}

// ✅ 推荐：异步处理
async handleLLMNewToken(token: string) {
  // 不等待结果
  db.insert({ token }).catch(console.error);
}
```

#### 原则 2：幂等性

```typescript
// ✅ 确保多次调用结果一致
class IdempotentHandler extends BaseCallbackHandler {
  private processed = new Set<string>();

  async handleChainEnd(outputs, runId) {
    if (this.processed.has(runId)) {
      return; // 已处理，跳过
    }

    this.processed.add(runId);
    // 处理逻辑...
  }
}
```

#### 原则 3：容错设计

```typescript
class ResilientHandler extends BaseCallbackHandler {
  async handleLLMEnd(output) {
    try {
      await this.sendMetrics(output);
    } catch (error) {
      console.error("发送指标失败:", error);
      // 不抛出错误，避免影响主流程
    }
  }
}
```

### 2. 生产环境建议

#### 使用环境变量控制详细程度

```typescript
const callbacks = process.env.NODE_ENV === "development"
  ? [new ConsoleCallbackHandler()]
  : [new ProductionMetricsHandler()];
```

#### 分离开发和生产 Callback

```typescript
// 开发环境：详细日志
class DevHandler extends BaseCallbackHandler {
  async handleLLMStart() {
    console.log("🚀 LLM Start");
  }

  async handleLLMNewToken(token: string) {
    process.stdout.write(token);
  }
}

// 生产环境：指标上报
class ProdHandler extends BaseCallbackHandler {
  async handleLLMEnd(output) {
    // 只上报关键指标
    metrics.record("llm_tokens", output.llmOutput?.tokenUsage.totalTokens);
  }
}
```

### 3. 安全性与隐私

#### 过滤敏感信息

```typescript
class SafeHandler extends BaseCallbackHandler {
  private filterSensitive(text: string): string {
    return text
      .replace(/\d{11}/g, "***********") // 手机号
      .replace(/sk-[a-zA-Z0-9]+/g, "sk-***"); // API Key
  }

  async handleLLMStart(llm, prompts) {
    console.log("Prompt:", this.filterSensitive(prompts[0]));
  }
}
```

#### 避免日志中包含用户隐私

```typescript
class PrivacyHandler extends BaseCallbackHandler {
  async handleChainStart(chain, inputs) {
    // ❌ 不要记录原始输入
    // console.log("Inputs:", inputs);

    // ✅ 只记录输入的 hash
    console.log("Input hash:", this.hash(JSON.stringify(inputs)));
  }
}
```

### 4. 监控与告警

#### 关键指标监控

```typescript
class MonitoringHandler extends BaseCallbackHandler {
  async handleLLMEnd(output) {
    const usage = output.llmOutput?.tokenUsage;

    // 1. 成本监控
    const cost = this.calculateCost(usage);
    if (cost > 0.1) {
      alert.send("单次调用成本过高: $" + cost);
    }

    // 2. Token 消耗监控
    if (usage.totalTokens > 2000) {
      alert.send("Token 消耗过多: " + usage.totalTokens);
    }

    // 3. 上报到监控系统
    metrics.record("llm_cost", cost);
    metrics.record("llm_tokens", usage.totalTokens);
  }

  async handleLLMError(err) {
    // 错误告警
    alert.send("LLM 调用失败: " + err.message);
    errorReporter.report(err);
  }
}
```

#### 性能追踪

```typescript
class PerformanceHandler extends BaseCallbackHandler {
  private timings = new Map<string, number>();

  async handleChainStart(chain, inputs, runId) {
    this.timings.set(runId, Date.now());
  }

  async handleChainEnd(outputs, runId) {
    const duration = Date.now() - this.timings.get(runId)!;

    // 慢查询告警
    if (duration > 5000) {
      alert.send(`Chain 执行过慢: ${duration}ms`);
    }

    metrics.record("chain_duration", duration);
    this.timings.delete(runId);
  }
}
```

---

## 📚 参考资源

### 官方文档

- [LangChain.js Callbacks](https://js.langchain.com/docs/modules/callbacks/)
- [LangChain.js Streaming](https://js.langchain.com/docs/modules/model_io/models/llms/streaming_llm)
- [OpenAI API 文档](https://platform.openai.com/docs)

### 相关技术

- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [LangSmith (链路追踪)](https://docs.smith.langchain.com/)

---

## 🎯 本章小结

通过本章学习，你已经掌握：

✅ **核心概念**
- Callback 的作用和生命周期事件
- Run 树与嵌套调用追踪
- 流式输出与打字机效果
- 取消与超时控制

✅ **实践技能**
- 使用内置 Callback 快速调试
- 编写自定义 Callback 收集指标
- 实现流式输出和实时进度上报
- 构建完整的实时聊天系统

✅ **最佳实践**
- Callback 设计原则（快速、幂等、容错）
- 生产环境配置与监控
- 安全性与隐私保护
- 性能优化与成本控制

---

## 🚀 下一步

在下一章《Runnable 接口与任务编排系统》中，我们将：

- 深入 Runnable 的组合、分支、并行与缓存
- 将复杂工作流抽象为可复用的流水线
- 与 LangGraph 状态图联动，构建企业级编排

---

**祝学习愉快！如有问题，欢迎提 Issue 讨论。** 🎉
