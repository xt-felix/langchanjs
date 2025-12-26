# 第4章项目概览 📊

## 📁 项目结构

```
src/ch04/
├── README.md                    # 📖 完整文档（概念 + 示例 + 最佳实践）
├── console-callback.ts          # 🎯 示例1：控制台回调（快速上手）
├── metrics-callback.ts          # 📊 示例2：自定义 CallbackHandler（指标收集器）
├── with-metrics.ts              # 🔧 示例3：使用自定义 Callback
├── stream-cli.ts                # 📡 示例4：流式输出（打字机效果）
├── cancel.ts                    # 🛑 示例5：取消和超时控制
├── runnable-callback.ts         # 🔗 示例6：Runnable 回调融合（链路追踪）
└── realtime-chat/
    └── server.ts                # 🚀 实战项目：实时聊天系统
```

## 🎯 学习路径

### 第一步：理解基础概念（5 分钟）

阅读 [README.md](./README.md) 的前三节：
- 什么是 Callback？
- 为什么需要 Callback？
- 快速开始

### 第二步：动手实践（30 分钟）

按顺序运行示例：

```bash
# 1. 控制台回调（观察执行过程）
npm run callback:console

# 2. 自定义 Callback（收集指标）
npm run callback:metrics

# 3. 流式输出（打字机效果）
npm run callback:stream

# 4. 取消和超时
npm run callback:cancel

# 5. Runnable 链路追踪
npm run callback:runnable
```

### 第三步：实战项目（20 分钟）

```bash
# 实时聊天系统（综合应用）
npm run callback:realtime-chat
```

### 第四步：深入理解（15 分钟）

阅读 [README.md](./README.md) 的进阶内容：
- 核心概念详解
- 常见问题
- 最佳实践

## 📚 核心知识点

### 1. Callback 生命周期

| 事件 | 触发时机 | 用途 |
|-----|---------|------|
| `handleLLMStart` | LLM 开始执行 | 记录开始时间、打印日志 |
| `handleLLMNewToken` | 收到新 Token | 流式输出、实时显示 |
| `handleLLMEnd` | LLM 执行完成 | 收集指标、计算耗时 |
| `handleLLMError` | LLM 执行出错 | 错误处理、告警 |
| `handleChainStart` | Chain 开始执行 | 链路追踪 |
| `handleChainEnd` | Chain 执行完成 | 性能分析 |
| `handleToolStart` | Tool 开始执行 | 工具监控 |
| `handleToolEnd` | Tool 执行完成 | 工具性能分析 |

### 2. 流式输出 vs 非流式

```typescript
// 非流式：等待完整结果
const result = await model.invoke("问题");
console.log(result); // 2 秒后一次性输出

// 流式：逐个 Token 返回
const stream = await model.stream("问题");
for await (const chunk of stream) {
  process.stdout.write(chunk.content); // 实时输出
}
```

**优势**：
- ✅ 降低首次响应延迟（从 2000ms 降到 150ms）
- ✅ 提升用户体验（立即看到响应）
- ✅ 支持打字机效果

### 3. 取消与超时

```typescript
// 方式 1：AbortController
const controller = new AbortController();
setTimeout(() => controller.abort(), 500);

await model.invoke("问题", { signal: controller.signal });

// 方式 2：Model 级别超时
const model = new ChatOpenAI({ timeout: 5000 });
```

### 4. Run 树（嵌套追踪）

```
invoke (runId: A)
 ├─ Prompt.format (runId: B, parent: A)
 ├─ LLM.invoke (runId: C, parent: A)
 │   ├─ token#1
 │   ├─ token#2
 │   └─ ...
 └─ OutputParser.parse (runId: D, parent: A)
```

通过 `runId` 和 `parentRunId` 可以重建完整的调用链路。

## 💡 关键代码片段

### 1. 自定义 Callback 模板

```typescript
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

class MyHandler extends BaseCallbackHandler {
  name = "my-handler";

  async handleLLMStart() {
    // LLM 开始执行
  }

  async handleLLMNewToken(token: string) {
    // 收到新 Token
  }

  async handleLLMEnd(output) {
    // LLM 执行完成
  }

  async handleLLMError(err: Error) {
    // LLM 执行出错
  }
}

// 使用
const model = new ChatOpenAI({
  callbacks: [new MyHandler()],
});
```

### 2. 流式输出 + 指标收集

```typescript
const model = new ChatOpenAI({ streaming: true });
const stream = await model.stream("问题");

let tokenCount = 0;
const startTime = Date.now();

for await (const chunk of stream) {
  tokenCount++;
  process.stdout.write(chunk.content);
}

const duration = Date.now() - startTime;
console.log(`\n速度: ${tokenCount / (duration / 1000)} tokens/s`);
```

### 3. 链路追踪

```typescript
class TreeTracer extends BaseCallbackHandler {
  private depth = 0;

  async handleChainStart(chain, inputs, runId, parentRunId) {
    console.log("  ".repeat(this.depth) + `┌─ [${chain.name}]`);
    this.depth++;
  }

  async handleChainEnd(outputs, runId) {
    this.depth--;
    console.log("  ".repeat(this.depth) + `└─ [完成]`);
  }
}
```

## 🚀 实战应用场景

### 1. 实时聊天应用

**技术栈**：Next.js + SSE + Callback

```typescript
// 服务端：通过 Callback 推送事件
class RealtimeChatHandler extends BaseCallbackHandler {
  async handleLLMNewToken(token: string) {
    // 通过 SSE 推送到前端
    controller.enqueue(encoder.encode(`data: ${token}\n\n`));
  }
}

// 前端：订阅 SSE 实时渲染
const eventSource = new EventSource("/api/chat");
eventSource.onmessage = (e) => {
  setText((prev) => prev + e.data); // 打字机效果
};
```

### 2. 性能监控系统

```typescript
class PerformanceMonitor extends BaseCallbackHandler {
  async handleLLMEnd(output) {
    const metrics = {
      tokens: output.llmOutput?.tokenUsage.totalTokens,
      cost: this.calculateCost(output),
      duration: Date.now() - this.startTime,
    };

    // 上报到监控系统
    monitoring.record(metrics);

    // 告警
    if (metrics.cost > 0.1) {
      alert.send("成本过高: $" + metrics.cost);
    }
  }
}
```

### 3. 调试工具

```typescript
class DebugHandler extends BaseCallbackHandler {
  async handleChainStart(chain, inputs, runId, parentRunId) {
    console.log(`[${chain.name}] Start`);
    console.log(`  RunId: ${runId}`);
    console.log(`  Parent: ${parentRunId}`);
    console.log(`  Inputs:`, inputs);
  }

  async handleChainEnd(outputs, runId) {
    console.log(`[${runId}] End`);
    console.log(`  Outputs:`, outputs);
  }
}
```

## ❓ 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| 如何启用流式输出？ | `streaming: true` + `stream()` 方法 |
| 如何取消请求？ | 使用 `AbortController` + `signal` 参数 |
| 如何收集指标？ | 自定义 Callback 实现 `handleLLMEnd` |
| 如何追踪链路？ | 通过 `runId` 和 `parentRunId` 重建树 |
| Callback 会影响性能吗？ | 影响很小，但应避免阻塞操作 |

## 📖 延伸阅读

- [LangChain.js Callbacks 官方文档](https://js.langchain.com/docs/modules/callbacks/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [AbortController API](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

## 🎯 下一步

学完本章后，建议：

1. ✅ 在自己的项目中集成 Callback 收集指标
2. ✅ 实现流式输出提升用户体验
3. ✅ 搭建监控系统追踪成本和性能
4. ✅ 进入第 5 章学习 Runnable 接口与任务编排

---

**祝学习愉快！** 🎉
