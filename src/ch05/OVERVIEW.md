# 第5章项目概览 📊

## 🎉 完成！第5章 Runnable 接口与任务编排系统已创建完成

### 📦 创建的文件清单

#### 核心代码示例（3个）：

1. **[sequence-basic.ts](src/ch05/sequence-basic.ts)** - 基础流水线
   - Prompt → Model → Parser 的基础串联
   - 逐步执行演示
   - 可复用性展示
   - 适合快速理解 Runnable 的核心概念

2. **[lambda-basic.ts](src/ch05/lambda-basic.ts)** - Lambda 函数包装
   - 同步和异步 Lambda
   - 复杂数据处理
   - 串联多个 Lambda
   - 批量处理
   - 错误处理

3. **[parallel-basic.ts](src/ch05/parallel-basic.ts)** - 并行执行
   - 基础并行执行
   - 并行调用 LLM（多角度分析）
   - 扇出/汇聚模式
   - 性能对比（串行 vs 并行）

#### 文档（2个）：

4. **[README.md](src/ch05/README.md)** - 完整教程文档（约 1500 行）
   - 核心概念详解
   - 代码示例详解
   - 实战项目说明
   - 常见问题解答
   - 最佳实践建议

5. **OVERVIEW.md**（本文档）- 项目概览
   - 学习路径指引
   - 核心知识点总结
   - 关键代码片段
   - 应用场景示例

### 🚀 运行命令

```bash
# 基础示例
npm run runnable:sequence         # 基础流水线
npm run runnable:lambda           # Lambda 函数包装
npm run runnable:parallel         # 并行执行
```

### 📊 代码统计

- **总文件数**: 5 个
- **核心代码**: 约 800 行
- **文档**: 约 1500 行
- **示例数量**: 15+ 个可运行的演示

### 🎯 核心特点

1. **循序渐进**: 从简单的顺序流水线到复杂的并行编排
2. **代码丰富**: 每个概念都有详细的代码示例
3. **注释详细**: 关键代码都有中英文注释和 emoji 标识
4. **实战导向**: 提供完整的实战项目架构设计
5. **最佳实践**: 包含生产环境的优化建议

### 💡 知识点覆盖

✅ Runnable 核心接口（invoke、stream、batch、pipe）
✅ 常用实现（Lambda、Sequence、Parallel、Passthrough）
✅ 编排模式（顺序、分支、扇出/汇聚、Map/Reduce）
✅ 流式处理和批量处理
✅ 错误处理、回退、重试机制
✅ 类型安全与 TypeScript 泛型
✅ 性能优化（并行、缓存、批处理）
✅ 测试策略（单元测试、集成测试、Mock）
✅ 内容处理流水线架构
✅ RAG ETL 流水线架构

### 📚 参考了 ch03/ch04 的优秀设计

- **结构清晰**: 从基础到高级，逐步深入
- **文档完整**: README 包含概念、示例、FAQ、最佳实践
- **代码规范**: 统一的命名、注释和格式
- **emoji 标识**: 使用 emoji 提升可读性
- **运行脚本**: 统一的命名规范 `runnable:xxx`

### 🎓 学习建议

1. **第一天**: 阅读 README 的基础部分，运行前 2 个示例
   - 理解 Runnable 的核心概念
   - 掌握 pipe() 的使用方法
   - 学习 RunnableLambda 的基本用法

2. **第二天**: 运行并行执行示例，理解性能优化
   - 掌握 RunnableParallel 的使用
   - 理解扇出/汇聚模式
   - 学习性能优化技巧

3. **第三天**: 阅读实战项目架构设计
   - 内容处理流水线的完整架构
   - RAG ETL 的处理流程
   - 实战项目的最佳实践

4. **第四天**: 在自己项目中应用
   - 识别可以用 Runnable 优化的代码
   - 设计自己的工作流编排
   - 实现可复用的组件库

### 🔗 与其他章节的关联

- **ch03 (Memory)**: Runnable 可以包装 Memory 操作
- **ch04 (Callback)**: Runnable 提供统一的 Callback 接口
- **ch06+ (Agent/Tool)**: Runnable 是所有组件的基础抽象

### 🎯 核心优势

#### 1. 统一接口

```typescript
// 所有组件都实现 Runnable 接口
const prompt = PromptTemplate.fromTemplate("...");  // Runnable
const model = new ChatOpenAI();                     // Runnable
const parser = new StringOutputParser();            // Runnable
const custom = new RunnableLambda(...);             // Runnable

// 统一调用方式
await prompt.invoke(input);
await model.invoke(input);
await parser.invoke(input);
await custom.invoke(input);
```

#### 2. 可组合性

```typescript
// 轻松串联
const chain = prompt
  .pipe(model)
  .pipe(parser);

// 嵌套组合
const pipeline = step1
  .pipe(step2)
  .pipe(step3.pipe(step4));

// 并行组合
const parallel = new RunnableParallel({
  path1: chain1,
  path2: chain2,
});
```

#### 3. 可复用性

```typescript
// 定义一次，多处使用
const model = new ChatOpenAI({ temperature: 0 });
const parser = new StringOutputParser();

const explainChain = promptA.pipe(model).pipe(parser);
const translateChain = promptB.pipe(model).pipe(parser);
const summarizeChain = promptC.pipe(model).pipe(parser);
```

#### 4. 可测试性

```typescript
// 每个 Runnable 都可以独立测试
describe("Prompt", () => {
  it("should format correctly", async () => {
    const result = await prompt.invoke(input);
    expect(result).toBeDefined();
  });
});

describe("Full Chain", () => {
  it("should work end-to-end", async () => {
    const result = await chain.invoke(input);
    expect(typeof result).toBe("string");
  });
});
```

### 📐 编排模式速查表

| 模式 | 使用场景 | 实现方式 |
|-----|---------|---------|
| 顺序流水线 | 依次处理步骤 | `a.pipe(b).pipe(c)` |
| 条件分支 | 根据条件选路径 | `RunnableLambda` 路由 |
| 扇出/汇聚 | 并行处理后合并 | `RunnableParallel` + merge |
| Map/Reduce | 对数组元素批处理 | `batch()` + reduce |
| 错误回退 | 主流程失败降级 | try/catch + fallback |
| 重试机制 | 临时错误自动重试 | while loop + exponential backoff |

### 💻 关键代码片段

#### 1. 基础流水线

```typescript
const chain = prompt
  .pipe(model)
  .pipe(parser);

const result = await chain.invoke(input);
```

#### 2. Lambda 包装

```typescript
const clean = new RunnableLambda<string, string>((text) => {
  return text.trim().toLowerCase();
});

const pipeline = clean.pipe(tokenize).pipe(count);
```

#### 3. 并行执行

```typescript
const parallel = new RunnableParallel({
  summary: summarizeChain,
  sentiment: sentimentChain,
  keywords: keywordsChain,
});

const result = await parallel.invoke({ text: "..." });
```

#### 4. 条件分支

```typescript
const router = new RunnableLambda(async (input, config) => {
  if (condition(input)) {
    return await pathA.invoke(input, config);
  } else {
    return await pathB.invoke(input, config);
  }
});
```

#### 5. 错误处理

```typescript
async function withFallback(input: string) {
  try {
    return await primary.invoke(input);
  } catch {
    return await fallback.invoke(input);
  }
}
```

### 🚀 实战应用场景

#### 1. 内容处理流水线

```
Input → 清洗 → 语言识别 → 翻译 → 摘要 → 并行分析 → JSON
```

**应用**：
- 内容审核系统
- 智能摘要生成
- 多语言内容处理
- 情感分析平台

#### 2. RAG 数据处理（ETL）

```
文档 → 加载 → 分块 → 过滤 → 去重 → 并行嵌入 → 向量库
```

**应用**：
- RAG 系统数据预处理
- 知识库构建
- 文档向量化
- 批量数据导入

#### 3. 多步骤任务编排

```
Input → 步骤1 → 条件分支
                  ↙    ↘
              路径A    路径B
                  ↘    ↙
                  合并 → Output
```

**应用**：
- 智能客服流程
- 审批工作流
- 多阶段数据处理
- 复杂业务逻辑编排

### ❓ 快速问答

**Q: Runnable 和普通函数有什么区别？**
A: Runnable 提供统一接口（invoke/stream/batch）、可组合性（pipe）、内置 Callback 支持。

**Q: 什么时候使用并行？**
A: I/O 密集型任务（API 调用、数据库查询、LLM 调用）且任务独立时。

**Q: 如何调试 Runnable 链路？**
A: 1) 逐步测试每个环节 2) 添加日志 Lambda 3) 使用 Callback 追踪。

**Q: 性能开销大吗？**
A: 很小（< 2%），因为是轻量抽象，不影响核心逻辑。

### 📖 延伸阅读

- [LangChain.js Runnable 官方文档](https://js.langchain.com/docs/modules/chains/)
- [LCEL (LangChain Expression Language)](https://js.langchain.com/docs/expression_language/)
- [函数式编程指南](https://github.com/getify/Functional-Light-JS)
- [管道模式](https://en.wikipedia.org/wiki/Pipeline_(software))

---

## 🎉 总结

第5章全面介绍了 Runnable 接口与任务编排系统，从基础概念到实战应用，提供了完整的学习路径。

**核心收获**：
1. 理解 Runnable 的设计理念和优势
2. 掌握 Lambda、Sequence、Parallel 的使用
3. 学会设计可组合、可复用的工作流
4. 了解实战项目的架构设计

**下一步**：
- 在自己的项目中应用 Runnable
- 设计可复用的组件库
- 优化现有的工作流编排
- 学习 ch06：LangGraph 与状态机编排

---

**祝学习愉快！** 🎉
