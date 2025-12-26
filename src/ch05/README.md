# Chapter 05: Runnable 接口与任务编排系统 🔧

> 掌握 LangChain.js 的 Runnable 抽象，构建可组合、可复用、可测试的智能工作流

## 📚 目录

- [什么是 Runnable？](#什么是-runnable)
- [为什么需要 Runnable？](#为什么需要-runnable)
- [快速开始](#快速开始)
- [核心概念详解](#核心概念详解)
- [代码示例详解](#代码示例详解)
- [实战项目](#实战项目)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

---

## 🎯 什么是 Runnable？

### 核心理念

**Runnable** 是 LangChain.js 的**通用可执行单元抽象**。它统一了"输入 → 处理 → 输出"的模式，使得 Prompt、Model、Parser、Retriever、Tool 甚至自定义函数，都能以同一套接口进行组合与编排。

```typescript
// ❌ 没有 Runnable：各个组件接口不统一
const promptResult = formatPrompt(input);
const modelResult = await callModel(promptResult);
const finalResult = parseOutput(modelResult);

// ✅ 使用 Runnable：统一的接口，可组合
const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke(input);
```

### 标准接口

所有 Runnable 都实现了以下核心方法：

```typescript
interface Runnable<Input, Output> {
  // 单次调用
  invoke(input: Input, options?: RunnableConfig): Promise<Output>;

  // 流式产出
  stream(input: Input, options?: RunnableConfig): AsyncGenerator<Output>;

  // 批量处理
  batch(inputs: Input[], options?: RunnableConfig): Promise<Output[]>;

  // 串联下一个 Runnable
  pipe<NewOutput>(next: Runnable<Output, NewOutput>): Runnable<Input, NewOutput>;
}
```

### 核心优势

1. **统一接口**：所有组件用同样的方式调用
2. **可组合**：通过 `pipe()` 轻松串联
3. **可复用**：同一个组件可用于不同场景
4. **可测试**：每个环节都可以独立测试
5. **可观测**：统一的 Callback 机制

---

## 🤔 为什么需要 Runnable？

### 1. 解决接口不统一的问题

**场景**：没有 Runnable 时，不同组件的调用方式各不相同

```typescript
// ❌ 没有统一接口：难以组合
const prompt = formatPrompt(data);
const modelOutput = await model.generate(prompt);
const parsed = parser.parse(modelOutput.text);
const retrieved = await retriever.search(parsed);
```

**使用 Runnable**：

```typescript
// ✅ 统一接口：轻松组合
const chain = prompt
  .pipe(model)
  .pipe(parser)
  .pipe(retriever);

const result = await chain.invoke(data);
```

### 2. 提升代码可复用性

```typescript
// 创建可复用的组件
const model = new ChatOpenAI({ temperature: 0 });
const parser = new StringOutputParser();

// 场景 1：技术解释
const explainChain = PromptTemplate
  .fromTemplate("解释：{term}")
  .pipe(model)
  .pipe(parser);

// 场景 2：代码生成
const codeChain = PromptTemplate
  .fromTemplate("生成 {language} 代码：{task}")
  .pipe(model)
  .pipe(parser);

// 场景 3：翻译
const translateChain = PromptTemplate
  .fromTemplate("翻译：{text}")
  .pipe(model)
  .pipe(parser);

// 同一个 Model 和 Parser，搭配不同 Prompt 完成不同任务
```

### 3. 便于测试和调试

```typescript
// 每个 Runnable 都可以独立测试
describe("Prompt Template", () => {
  it("should format correctly", async () => {
    const result = await prompt.invoke({ name: "张三" });
    expect(result.toString()).toContain("张三");
  });
});

describe("Model", () => {
  it("should generate response", async () => {
    const result = await model.invoke(promptOutput);
    expect(result.content).toBeTruthy();
  });
});

describe("Full Chain", () => {
  it("should work end-to-end", async () => {
    const result = await chain.invoke({ name: "张三" });
    expect(typeof result).toBe("string");
  });
});
```

### 4. 支持流式处理和批量处理

```typescript
// 流式处理
const stream = await chain.stream(input);
for await (const chunk of stream) {
  process.stdout.write(chunk); // 打字机效果
}

// 批量处理（提高吞吐量）
const results = await chain.batch([input1, input2, input3]);
```

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

### 2. 运行第一个示例

```bash
# 运行基础流水线示例
npm run runnable:sequence
```

**预期输出**：

```
╔════════════════════════════════════════════════════════════════╗
║              最基础的 Runnable 流水线                          ║
╚════════════════════════════════════════════════════════════════╝

📊 流水线结构：
   Input {role, content}
     ↓
   Prompt Template (格式化输入)
     ↓
   LLM Model (生成回答)
     ↓
   String Parser (提取文本)
     ↓
   Output (string)

✅ 输出结果：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. React 18 引入了并发特性，这是架构的重大升级
2. 主要包括自动批处理、过渡、悬念等功能
3. 使用 useTransition 和 useDeferredValue 标记非紧急更新
4. 让 React 能保持响应性，即使在大量更新时也流畅
5. 优先处理用户交互，显著提升用户体验
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. 运行其他示例

```bash
# 核心概念
npm run runnable:lambda          # Lambda 函数包装
npm run runnable:parallel        # 并行执行
npm run runnable:branch          # 条件分支
npm run runnable:stream          # 流式处理
npm run runnable:errors          # 错误处理

# 实战项目
npm run runnable:content-pipeline # 内容处理流水线
npm run runnable:rag-etl         # RAG 数据处理
```

---

## 🔍 核心概念详解

### 1. 常用 Runnable 实现

#### RunnableLambda

将任意函数包装为 Runnable：

```typescript
import { RunnableLambda } from "@langchain/core/runnables";

// 同步函数
const uppercase = new RunnableLambda<string, string>((text) => {
  return text.toUpperCase();
});

// 异步函数
const fetchData = new RunnableLambda<string, any>(async (id) => {
  const response = await fetch(`/api/data/${id}`);
  return response.json();
});

// 使用
const result = await uppercase.invoke("hello"); // "HELLO"
```

**适用场景**：
- 数据预处理（清洗、格式化、验证）
- 自定义逻辑（计算、转换、路由）
- 外部 API 调用
- 数据库操作

#### RunnableSequence

按顺序串联多个 Runnable：

```typescript
import { RunnableSequence } from "@langchain/core/runnables";

// 方式 1：使用 pipe()
const chain = step1.pipe(step2).pipe(step3);

// 方式 2：使用 from()
const chain = RunnableSequence.from([step1, step2, step3]);

// 数据流：Input → step1 → step2 → step3 → Output
```

#### RunnableParallel

并行执行多个 Runnable：

```typescript
import { RunnableParallel } from "@langchain/core/runnables";

const parallel = new RunnableParallel({
  task1: runnable1,
  task2: runnable2,
  task3: runnable3,
});

const result = await parallel.invoke(input);
// 结果: { task1: ..., task2: ..., task3: ... }
```

**执行流程**：

```
        Input
          ↓
    ┌─────┼─────┐
    ↓     ↓     ↓
  task1 task2 task3  (并行)
    ↓     ↓     ↓
    └─────┼─────┘
          ↓
   { task1, task2, task3 }
```

#### RunnablePassthrough

原样透传输入：

```typescript
import { RunnablePassthrough } from "@langchain/core/runnables";

const chain = RunnableSequence.from([
  RunnablePassthrough.assign({
    // 保留原始输入，添加新字段
    processed: processLambda,
  }),
]);

// Input: { text: "hello" }
// Output: { text: "hello", processed: "HELLO" }
```

### 2. 核心方法详解

#### invoke() - 单次执行

```typescript
const result = await runnable.invoke(input, {
  callbacks: [handler],  // 回调
  tags: ["demo"],        // 标签
  metadata: { user: "张三" }, // 元数据
});
```

#### stream() - 流式执行

```typescript
const stream = await runnable.stream(input);

for await (const chunk of stream) {
  process.stdout.write(chunk); // 实时输出
}
```

#### batch() - 批量执行

```typescript
const results = await runnable.batch([
  input1,
  input2,
  input3,
], {
  maxConcurrency: 3, // 限制并发数
});
```

#### pipe() - 串联

```typescript
const chain = runnable1
  .pipe(runnable2)
  .pipe(runnable3);

// 等价于：
const chain = RunnableSequence.from([
  runnable1,
  runnable2,
  runnable3,
]);
```

### 3. 编排模式

#### 顺序流水线

```
Input → Step1 → Step2 → Step3 → Output
```

```typescript
const pipeline = step1.pipe(step2).pipe(step3);
```

#### 条件分支

```
       Input
         ↓
      [判断]
       ↙  ↘
    路径A  路径B
       ↘  ↙
       Output
```

```typescript
const router = new RunnableLambda(async (input) => {
  if (condition(input)) {
    return await pathA.invoke(input);
  } else {
    return await pathB.invoke(input);
  }
});
```

#### 扇出/汇聚（Fan-out/Fan-in）

```
        Input
          ↓
    ┌─────┼─────┐
    ↓     ↓     ↓
   R1    R2    R3  (并行)
    ↓     ↓     ↓
    └─────┼─────┘
          ↓
       Merge
          ↓
       Output
```

```typescript
const pipeline = RunnableSequence.from([
  new RunnableParallel({ a: r1, b: r2, c: r3 }),
  mergeLambda,
]);
```

#### Map/Reduce

```
   Input (array)
       ↓
    [Map] (对每个元素应用 Runnable)
       ↓
  [Reduce] (汇总结果)
       ↓
   Output
```

```typescript
const mapReduce = new RunnableLambda(async (items: string[]) => {
  // Map: 并行处理每个元素
  const mapped = await Promise.all(
    items.map((item) => processLambda.invoke(item))
  );

  // Reduce: 汇总结果
  return merged.reduce((acc, item) => acc + item, "");
});
```

---

## 💻 代码示例详解

### 案例 1：基础流水线（Sequence）

**文件**：[sequence-basic.ts](./sequence-basic.ts)

**功能**：演示 Prompt → Model → Parser 的基础流水线

**核心代码**：

```typescript
// 1. 创建各个 Runnable
const prompt = PromptTemplate.fromTemplate("你是{role}，总结：{content}");
const model = new ChatOpenAI({ temperature: 0 });
const parser = new StringOutputParser();

// 2. 使用 pipe() 串联
const chain = prompt.pipe(model).pipe(parser);

// 3. 调用
const result = await chain.invoke({
  role: "技术作者",
  content: "React 18 并发特性...",
});
```

**运行示例**：

```bash
npm run runnable:sequence
```

**学习要点**：
- 所有组件（Prompt、Model、Parser）都是 Runnable
- 使用 `pipe()` 串联形成处理链
- 数据自动在 Runnable 之间流转
- 每个 Runnable 可以独立测试

---

### 案例 2：Lambda 函数包装

**文件**：[lambda-basic.ts](./lambda-basic.ts)

**功能**：将自定义函数包装为 Runnable

**核心代码**：

```typescript
// 数据清洗
const sanitize = new RunnableLambda<string, string>((text) => {
  return text.trim().toLowerCase();
});

// 分词
const tokenize = new RunnableLambda<string, string[]>((text) => {
  return text.split(/\s+/).filter(Boolean);
});

// 计数
const count = new RunnableLambda<string[], number>((words) => {
  return words.length;
});

// 串联
const pipeline = sanitize.pipe(tokenize).pipe(count);

const result = await pipeline.invoke("  Hello World  ");
// 结果: 2
```

**运行示例**：

```bash
npm run runnable:lambda
```

**学习要点**：
- RunnableLambda 可以包装任意函数
- 支持同步和异步函数
- 可以指定输入输出类型
- 通过 pipe() 与其他 Runnable 串联

---

### 案例 3：并行执行（Parallel）

**文件**：[parallel-basic.ts](./parallel-basic.ts)

**功能**：并行执行多个 Runnable，提升性能

**核心代码**：

```typescript
const model = new ChatOpenAI({ temperature: 0 });

// 创建三个分析链
const summaryChain = PromptTemplate.fromTemplate("总结：{text}")
  .pipe(model).pipe(new StringOutputParser());

const sentimentChain = PromptTemplate.fromTemplate("情感：{text}")
  .pipe(model).pipe(new StringOutputParser());

const keywordsChain = PromptTemplate.fromTemplate("关键词：{text}")
  .pipe(model).pipe(new StringOutputParser());

// 并行执行
const parallel = new RunnableParallel({
  summary: summaryChain,
  sentiment: sentimentChain,
  keywords: keywordsChain,
});

const result = await parallel.invoke({ text: "..." });
// 结果: { summary: "...", sentiment: "...", keywords: "..." }
```

**性能对比**：

| 执行方式 | 耗时 |
|---------|------|
| 串行执行 | ~3000ms |
| 并行执行 | ~1000ms |
| 性能提升 | **3倍** ⚡ |

**运行示例**：

```bash
npm run runnable:parallel
```

**学习要点**：
- RunnableParallel 并行执行多个 Runnable
- 显著提升 I/O 密集型任务的性能
- 结果汇总成一个对象
- 适合扇出/汇聚模式

---

### 案例 4：条件分支（Branch）

**文件**：[branch-basic.ts](./branch-basic.ts)

**功能**：根据输入条件选择不同的处理路径

**核心代码**：

```typescript
const pathA = new RunnableLambda<string, string>((x) => x.toUpperCase());
const pathB = new RunnableLambda<string, string>((x) => x.toLowerCase());

// 路由器：根据条件选择路径
const router = new RunnableLambda<string, string>(async (input, config) => {
  const hasNumber = /\d/.test(input);

  if (hasNumber) {
    return pathA.invoke(input, config);
  } else {
    return pathB.invoke(input, config);
  }
});

await router.invoke("Hello123"); // "HELLO123" (路径A)
await router.invoke("Hello");    // "hello"    (路径B)
```

**运行示例**：

```bash
npm run runnable:branch
```

**学习要点**：
- 使用 RunnableLambda 实现路由逻辑
- 根据条件动态选择执行路径
- 每个路径都是独立的 Runnable
- 便于测试和维护

---

### 案例 5：流式处理（Stream）

**文件**：[stream-basic.ts](./stream-basic.ts)

**功能**：流式输出，实时显示生成内容

**核心代码**：

```typescript
const model = new ChatOpenAI({
  streaming: true, // 🔑 关键：启用流式
});

const chain = prompt.pipe(model).pipe(new StringOutputParser());

// 流式执行
const stream = await chain.stream({ question: "介绍 Runnable" });

for await (const chunk of stream) {
  process.stdout.write(chunk); // 打字机效果
}
```

**运行示例**：

```bash
npm run runnable:stream
```

**学习要点**：
- 启用 `streaming: true`
- 使用 `stream()` 方法
- 实时输出，降低感知延迟
- 适合长文本生成场景

---

### 案例 6：错误处理与重试

**文件**：[errors-basic.ts](./errors-basic.ts)

**功能**：错误处理、回退策略、重试机制

**核心代码**：

```typescript
// 主处理链
const primary = new RunnableLambda<string, string>((x) => {
  if (x.length < 5) throw new Error("输入太短");
  return x.toUpperCase();
});

// 回退处理
const fallback = new RunnableLambda<string, string>((x) => {
  return `[fallback] ${x}`;
});

// 带回退的执行
async function withFallback(input: string) {
  try {
    return await primary.invoke(input);
  } catch {
    return await fallback.invoke(input);
  }
}

await withFallback("hello");  // "HELLO"
await withFallback("hi");     // "[fallback] hi"
```

**重试机制**：

```typescript
async function retry<T>(fn: (x: T) => Promise<T>, x: T, times = 3) {
  let attempt = 0;

  while (attempt < times) {
    try {
      return await fn(x);
    } catch (e) {
      // 指数退避
      await new Promise((r) => setTimeout(r, 2 ** attempt * 200));
      attempt++;
    }
  }

  throw new Error("重试失败");
}
```

**运行示例**：

```bash
npm run runnable:errors
```

**学习要点**：
- 错误会在 Runnable 链中传播
- 可以实现回退策略
- 支持重试机制（指数退避）
- 错误处理不影响 Runnable 的组合性

---

## 🎯 实战项目

### 项目 1：内容智能处理流水线

**文件**：[content-pipeline/processor.ts](./content-pipeline/processor.ts)

**功能**：对用户输入的文本进行全方位分析

**处理流程**：

```
Input (用户文本)
  ↓
1. 数据清洗（去噪、截断、安全过滤）
  ↓
2. 语言识别（中文/英文/日文...）
  ↓
3. 翻译（非中文翻译为中文）
  ↓
4. 摘要生成（3-5条要点）
  ↓
5. 并行分析
   ├─ 风格分类（技术/营销/新闻/随笔）
   ├─ 情感分析（正面/中性/负面）
   └─ 关键词提取（3-5个关键词）
  ↓
6. 结构化输出（JSON）
  ↓
Output { lang, text, summary, style, sentiment, keywords }
```

**核心实现**：

```typescript
// 步骤 1：数据清洗
const sanitize = new RunnableLambda<{ text: string }, { text: string }>(
  ({ text }) => ({
    text: text.replace(/\s+/g, " ").trim().slice(0, 4000),
  })
);

// 步骤 2：语言识别
const detectLang = PromptTemplate.fromTemplate(
  "判断语言：{text}\n只返回：Chinese/English/Japanese"
).pipe(model).pipe(parser);

// 步骤 3：翻译（如果需要）
const translate = PromptTemplate.fromTemplate(
  "翻译成中文：{text}"
).pipe(model).pipe(parser);

// 步骤 4：摘要
const summarize = PromptTemplate.fromTemplate(
  "总结要点（3-5条）：{text}"
).pipe(model).pipe(parser);

// 步骤 5：并行分析
const analyze = new RunnableParallel({
  style: PromptTemplate.fromTemplate("判断风格：{text}").pipe(model).pipe(parser),
  sentiment: PromptTemplate.fromTemplate("判断情感：{text}").pipe(model).pipe(parser),
  keywords: PromptTemplate.fromTemplate("提取关键词：{text}").pipe(model).pipe(parser),
});

// 组合成完整流水线
const contentPipeline = RunnableSequence.from([
  sanitize,
  // ... 其他步骤
  analyze,
  formatOutput,
]);
```

**使用示例**：

```typescript
const result = await contentPipeline.invoke({
  text: "LangChain unifies prompts, LLMs, retrievers...",
});

console.log(result);
// {
//   lang: "English",
//   text: "LangChain 统一了 prompts、LLMs、retrievers...",
//   summary: "1. LangChain 是统一框架\n2. 提供可组合组件\n3. ...",
//   style: "技术",
//   sentiment: "正面",
//   keywords: ["LangChain", "框架", "组件"]
// }
```

**运行示例**：

```bash
npm run runnable:content-pipeline
```

**应用场景**：
- 内容审核系统
- 智能摘要生成
- 多语言内容处理
- 情感分析平台

---

### 项目 2：RAG 数据处理流水线（ETL）

**文件**：[rag-etl/processor.ts](./rag-etl/processor.ts)

**功能**：将原始文档处理成向量数据库可用的格式

**处理流程**：

```
Input (文档路径/glob)
  ↓
1. 加载文件（Markdown/PDF/TXT）
  ↓
2. 文档分块（RecursiveCharacterTextSplitter）
  ↓
3. 过滤短片段（< 50 字符）
  ↓
4. 去重（基于内容 hash）
  ↓
5. 并行嵌入
   ├─ 批次 1 → Embedding
   ├─ 批次 2 → Embedding
   └─ 批次 3 → Embedding
  ↓
6. 写入向量库（Chroma/Pinecone/Qdrant）
  ↓
7. 生成报告（处理统计、错误日志）
  ↓
Output { total, upserted, errors, duration }
```

**核心实现**：

```typescript
// 步骤 1：加载文件
const loadFiles = new RunnableLambda<string, Document[]>(async (glob) => {
  const loader = new DirectoryLoader(glob);
  return await loader.load();
});

// 步骤 2：分块
const splitDocs = new RunnableLambda<Document[], Document[]>(async (docs) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.splitDocuments(docs);
});

// 步骤 3：过滤
const filterChunks = new RunnableLambda<Document[], Document[]>((docs) => {
  return docs.filter((doc) => doc.pageContent.trim().length >= 50);
});

// 步骤 4：去重
const deduplicate = new RunnableLambda<Document[], Document[]>((docs) => {
  const seen = new Set<string>();
  return docs.filter((doc) => {
    const hash = createHash(doc.pageContent);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
});

// 步骤 5：并行嵌入
const embedBatch = new RunnableLambda<Document[], EmbeddedDoc[]>(
  async (docs) => {
    const embeddings = new OpenAIEmbeddings();
    // 分批处理，避免超出 API 限制
    const batches = chunk(docs, 20);
    const results = await Promise.all(
      batches.map((batch) => embeddings.embedDocuments(batch))
    );
    return results.flat();
  }
);

// 步骤 6：写入向量库
const upsertVectors = new RunnableLambda<EmbeddedDoc[], number>(
  async (docs) => {
    const vectorStore = new ChromaDB();
    await vectorStore.addDocuments(docs);
    return docs.length;
  }
);

// 组合成完整流水线
const ragETL = RunnableSequence.from([
  loadFiles,
  splitDocs,
  filterChunks,
  deduplicate,
  embedBatch,
  upsertVectors,
  generateReport,
]);
```

**使用示例**：

```typescript
const report = await ragETL.invoke("docs/**/*.md");

console.log(report);
// {
//   total: 150,
//   upserted: 142,
//   errors: 8,
//   duration: 45230,
//   stats: {
//     avgChunkSize: 856,
//     totalTokens: 121440,
//     estimatedCost: 0.012
//   }
// }
```

**运行示例**：

```bash
npm run runnable:rag-etl
```

**应用场景**：
- RAG 系统数据预处理
- 知识库构建
- 文档向量化
- 批量数据导入

---

## ❓ 常见问题

### Q1: Runnable 和普通函数有什么区别？

**答**：

| 特性 | 普通函数 | Runnable |
|------|---------|---------|
| 统一接口 | ❌ 各不相同 | ✅ invoke/stream/batch |
| 可组合性 | ❌ 手动组合 | ✅ pipe() 自动串联 |
| 流式支持 | ❌ 需要手动实现 | ✅ 内置 stream() |
| 批处理 | ❌ 需要手动实现 | ✅ 内置 batch() |
| Callback | ❌ 需要手动集成 | ✅ 统一 Callback 机制 |
| 类型安全 | ✅ TypeScript 支持 | ✅ 泛型参数 |

**示例对比**：

```typescript
// ❌ 普通函数：难以组合
async function process(input: string) {
  const cleaned = clean(input);
  const tokens = tokenize(cleaned);
  const count = countTokens(tokens);
  return count;
}

// ✅ Runnable：易于组合和复用
const pipeline = clean.pipe(tokenize).pipe(count);
const result = await pipeline.invoke(input);

// 同一个组件可用于不同场景
const pipeline2 = clean.pipe(tokenize).pipe(analyze);
```

### Q2: 什么时候应该使用 RunnableParallel？

**答**：

**适合并行**（使用 RunnableParallel）：
- ✅ I/O 密集型任务（API 调用、数据库查询）
- ✅ 独立的计算任务
- ✅ 多个 LLM 调用
- ✅ 扇出/汇聚模式

**不适合并行**（使用顺序执行）：
- ❌ 有依赖关系的任务
- ❌ 需要串行执行的逻辑
- ❌ 共享可变状态的任务

**性能对比**：

```typescript
// 场景：3个独立的 LLM 调用，每个耗时 1 秒

// 串行：3 秒
const r1 = await task1.invoke(input);
const r2 = await task2.invoke(input);
const r3 = await task3.invoke(input);

// 并行：1 秒 ⚡
const parallel = new RunnableParallel({ r1: task1, r2: task2, r3: task3 });
const result = await parallel.invoke(input);
```

### Q3: 如何调试复杂的 Runnable 链路？

**答**：

1. **逐步测试**：

```typescript
// 测试每个环节
const step1Result = await step1.invoke(input);
console.log("Step 1:", step1Result);

const step2Result = await step2.invoke(step1Result);
console.log("Step 2:", step2Result);

// 然后测试完整链路
const fullResult = await step1.pipe(step2).invoke(input);
```

2. **添加日志 Lambda**：

```typescript
const logLambda = new RunnableLambda((x) => {
  console.log("中间结果：", x);
  return x; // 原样返回
});

const chain = step1.pipe(logLambda).pipe(step2);
```

3. **使用 Callback**：

```typescript
class DebugHandler extends BaseCallbackHandler {
  async handleChainStart(chain, inputs) {
    console.log(`[${chain.name}] 输入:`, inputs);
  }

  async handleChainEnd(outputs) {
    console.log("输出:", outputs);
  }
}

await chain.invoke(input, {
  callbacks: [new DebugHandler()],
});
```

### Q4: Runnable 的性能开销大吗？

**答**：

开销很小，因为：

1. **轻量抽象**：Runnable 只是接口层，不影响核心逻辑
2. **零拷贝**：数据在 Runnable 之间传递时不会复制
3. **惰性执行**：只在调用 invoke/stream/batch 时才执行

**性能对比**：

```typescript
// 测试：1000 次调用

// 普通函数：1234ms
for (let i = 0; i < 1000; i++) {
  const result = await plainFunction(input);
}

// Runnable：1256ms（开销 < 2%）
for (let i = 0; i < 1000; i++) {
  const result = await runnable.invoke(input);
}
```

**优化建议**：
- ✅ 复用 Runnable 实例（不要每次创建新的）
- ✅ 使用 batch() 批量处理
- ✅ 合理使用并行（RunnableParallel）
- ❌ 避免过度嵌套（> 10 层）

---

## 🎓 最佳实践

### 1. 组合原则

#### 单一职责

每个 Runnable 只做一件事：

```typescript
// ❌ 不推荐：职责混杂
const processAll = new RunnableLambda(async (input) => {
  const cleaned = clean(input);
  const tokens = tokenize(cleaned);
  const analyzed = analyze(tokens);
  const formatted = format(analyzed);
  return formatted;
});

// ✅ 推荐：职责分离
const clean = new RunnableLambda((x) => ...);
const tokenize = new RunnableLambda((x) => ...);
const analyze = new RunnableLambda((x) => ...);
const format = new RunnableLambda((x) => ...);

const pipeline = clean.pipe(tokenize).pipe(analyze).pipe(format);
```

#### 可复用性

抽取通用组件：

```typescript
// 通用组件库
const components = {
  clean: new RunnableLambda((x: string) => x.trim()),
  tokenize: new RunnableLambda((x: string) => x.split(/\s+/)),
  count: new RunnableLambda((x: any[]) => x.length),
};

// 场景 1：计数
const countPipeline = components.clean
  .pipe(components.tokenize)
  .pipe(components.count);

// 场景 2：分析
const analyzePipeline = components.clean
  .pipe(components.tokenize)
  .pipe(analyzeTokens);
```

### 2. 类型安全

使用 TypeScript 泛型确保类型安全：

```typescript
// 明确输入输出类型
const process = new RunnableLambda<
  { text: string },           // 输入类型
  { words: string[]; count: number }  // 输出类型
>((input) => {
  const words = input.text.split(/\s+/);
  return { words, count: words.length };
});

// TypeScript 会检查类型
const result = await process.invoke({ text: "hello" });
// result: { words: string[]; count: number }

// ❌ 编译错误
await process.invoke({ content: "hello" });
```

### 3. 错误处理策略

#### 策略 1：在 Lambda 内部处理

```typescript
const safeParse = new RunnableLambda<string, number | null>((x) => {
  try {
    const num = parseFloat(x);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
});
```

#### 策略 2：在调用方处理

```typescript
try {
  const result = await chain.invoke(input);
} catch (error) {
  if (error instanceof ValidationError) {
    // 处理验证错误
  } else {
    // 处理其他错误
  }
}
```

#### 策略 3：回退策略

```typescript
async function withFallback<T>(
  primary: Runnable<T, any>,
  fallback: Runnable<T, any>,
  input: T
) {
  try {
    return await primary.invoke(input);
  } catch {
    return await fallback.invoke(input);
  }
}
```

### 4. 性能优化

#### 使用批处理

```typescript
// ❌ 低效：逐个处理
for (const input of inputs) {
  await runnable.invoke(input);
}

// ✅ 高效：批量处理
await runnable.batch(inputs);
```

#### 合理使用并行

```typescript
// 场景：3个独立的 LLM 调用

// ❌ 串行：~3秒
const a = await task1.invoke(input);
const b = await task2.invoke(input);
const c = await task3.invoke(input);

// ✅ 并行：~1秒
const parallel = new RunnableParallel({ a: task1, b: task2, c: task3 });
const result = await parallel.invoke(input);
```

#### 缓存昂贵操作

```typescript
const cache = new Map<string, any>();

const cachedRunnable = new RunnableLambda(async (input) => {
  const key = JSON.stringify(input);

  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await expensiveOperation(input);
  cache.set(key, result);
  return result;
});
```

### 5. 测试策略

#### 单元测试

```typescript
describe("Clean Lambda", () => {
  it("should trim whitespace", async () => {
    const result = await cleanLambda.invoke("  hello  ");
    expect(result).toBe("hello");
  });

  it("should handle empty input", async () => {
    const result = await cleanLambda.invoke("");
    expect(result).toBe("");
  });
});
```

#### 集成测试

```typescript
describe("Full Pipeline", () => {
  it("should process end-to-end", async () => {
    const result = await pipeline.invoke({
      text: "sample input",
    });

    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("keywords");
  });
});
```

#### Mock LLM

```typescript
class MockLLM extends BaseChatModel {
  async _generate(messages: BaseMessage[]) {
    return {
      generations: [{
        text: "mocked response",
        message: new AIMessage("mocked response"),
      }],
    };
  }
}

const testChain = prompt.pipe(new MockLLM()).pipe(parser);
```

---

## 📚 参考资源

### 官方文档

- [LangChain.js Runnable 文档](https://js.langchain.com/docs/modules/chains/)
- [LCEL (LangChain Expression Language)](https://js.langchain.com/docs/expression_language/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)

### 延伸阅读

- [函数式编程](https://github.com/getify/Functional-Light-JS)
- [响应式编程](https://rxjs.dev/)
- [管道模式](https://en.wikipedia.org/wiki/Pipeline_(software))

---

## 🎯 本章小结

通过本章学习，你已经掌握：

✅ **核心概念**
- Runnable 的定义和核心方法
- 常用实现（Lambda、Sequence、Parallel）
- 编排模式（顺序、分支、扇出/汇聚）

✅ **实践技能**
- 使用 pipe() 串联 Runnable
- 使用 RunnableLambda 包装自定义逻辑
- 使用 RunnableParallel 提升性能
- 实现错误处理和重试机制

✅ **实战项目**
- 内容智能处理流水线
- RAG 数据处理流水线

✅ **最佳实践**
- 单一职责和可复用性
- 类型安全和错误处理
- 性能优化和测试策略

---

## 🚀 下一步

在下一章《LangGraph 与状态机编排》中，我们将：

- 学习有状态的工作流编排
- 构建复杂的 Agent 系统
- 实现循环、条件、子图等高级模式
- 在企业场景中落地可靠的 AI 应用

---

**祝学习愉快！如有问题，欢迎提 Issue 讨论。** 🎉
