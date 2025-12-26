// 文件：src/ch04/runnable-callback.ts
// 演示：Runnable 回调融合，追踪完整执行链路

import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MetricsHandler } from "./metrics-callback";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { ChainValues } from "@langchain/core/outputs";
import "dotenv/config";

/**
 * 🎯 示例：Runnable 回调融合
 *
 * 什么是 Runnable？
 * Runnable 是 LangChain 的核心抽象，代表一个可执行的组件。
 * 所有的 Model、Prompt、Parser、Chain 都是 Runnable。
 *
 * 为什么需要追踪 Runnable？
 * 1. 链路追踪：了解数据如何在各个 Runnable 之间流转
 * 2. 性能分析：找出慢在哪个环节
 * 3. 调试工具：快速定位问题所在
 *
 * Run 树的概念：
 * 当一个 Runnable 调用另一个 Runnable 时，会形成一棵执行树：
 * - 每个节点有唯一的 runId
 * - 子节点的 parentRunId 指向父节点
 * - 可以重建完整的调用链路
 */

/**
 * 自定义回调：追踪 Runnable 执行链路
 */
class RunnableTracer extends BaseCallbackHandler {
  name = "runnable-tracer";
  private depth = 0;
  private runStack: Map<string, { name: string; startTime: number }> = new Map();

  private getIndent(): string {
    return "  ".repeat(this.depth);
  }

  async handleChainStart(
    chain: Serialized,
    inputs: ChainValues,
    runId: string,
    parentRunId?: string
  ): Promise<void> {
    const chainName = chain.id ? chain.id[chain.id.length - 1] : "Unknown";

    this.runStack.set(runId, {
      name: chainName,
      startTime: Date.now(),
    });

    console.log(`${this.getIndent()}┌─ 🔗 [${chainName}] (runId: ${runId.slice(0, 8)}...)`);
    console.log(`${this.getIndent()}│  输入:`, JSON.stringify(inputs, null, 2).split("\n").map((line, i) => i === 0 ? line : `${this.getIndent()}│  ${line}`).join("\n"));

    if (parentRunId) {
      console.log(`${this.getIndent()}│  父节点: ${parentRunId.slice(0, 8)}...`);
    }

    this.depth++;
  }

  async handleChainEnd(
    outputs: ChainValues,
    runId: string
  ): Promise<void> {
    this.depth--;

    const runInfo = this.runStack.get(runId);
    const duration = runInfo ? Date.now() - runInfo.startTime : 0;
    const chainName = runInfo?.name || "Unknown";

    console.log(`${this.getIndent()}│  输出:`, JSON.stringify(outputs, null, 2).split("\n").map((line, i) => i === 0 ? line : `${this.getIndent()}│  ${line}`).join("\n"));
    console.log(`${this.getIndent()}└─ ✅ [${chainName}] 完成 (${duration}ms)\n`);

    this.runStack.delete(runId);
  }

  async handleChainError(
    err: Error,
    runId: string
  ): Promise<void> {
    this.depth--;

    const runInfo = this.runStack.get(runId);
    const chainName = runInfo?.name || "Unknown";

    console.error(`${this.getIndent()}└─ ❌ [${chainName}] 错误: ${err.message}\n`);

    this.runStack.delete(runId);
  }
}

async function demoSimpleRunnableChain() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          简单 Runnable 链路追踪                                 ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const tracer = new RunnableTracer();

  // 构建一个简单的链：Prompt → Model → Parser
  const prompt = PromptTemplate.fromTemplate("根据以下提纲生成 3 条要点：\n\n{outline}");
  const model = new ChatOpenAI({ temperature: 0.3 });
  const parser = new StringOutputParser();

  const chain = RunnableSequence.from([prompt, model, parser]);

  console.log("🎯 任务：根据提纲生成要点\n");
  console.log("📊 执行链路：\n");

  const result = await chain.invoke(
    {
      outline: "前端性能优化：\n- 资源加载优化\n- 渲染性能优化\n- 网络优化\n- 监控与分析",
    },
    {
      callbacks: [tracer],
      tags: ["outline-generation"],
    }
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 最终结果：");
  console.log(result);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function demoNestedRunnableChain() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          嵌套 Runnable 链路追踪（Run 树）                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const tracer = new RunnableTracer();

  // 构建一个嵌套链：外层链包含内层链
  const stepPrompt = PromptTemplate.fromTemplate("步骤：{step}");
  const model = new ChatOpenAI({ temperature: 0.7 });
  const parser = new StringOutputParser();

  // 内层链：处理单个步骤
  const stepChain = RunnableSequence.from([stepPrompt, model, parser]);

  // 外层链：处理多个步骤
  const mainChain = RunnableSequence.from([
    // 步骤 1：生成步骤 1
    async (input: { task: string }) => {
      const result = await stepChain.invoke({ step: `${input.task} - 第一步` });
      return { task: input.task, step1: result };
    },
    // 步骤 2：生成步骤 2
    async (input) => {
      const result = await stepChain.invoke({ step: `${input.task} - 第二步` });
      return { ...input, step2: result };
    },
    // 步骤 3：汇总
    async (input) => {
      return {
        task: input.task,
        steps: [input.step1, input.step2],
      };
    },
  ]);

  console.log("🎯 任务：生成一个任务的执行步骤\n");
  console.log("📊 执行链路（注意嵌套层级）：\n");

  const result = await mainChain.invoke(
    { task: "实现一个 Todo 应用" },
    { callbacks: [tracer] }
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 最终结果：");
  console.log(JSON.stringify(result, null, 2));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function demoWithMetricsAndTracer() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          组合多个 Callback（链路追踪 + 指标收集）              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 同时使用两个 Callback：链路追踪器 + 指标收集器
  const tracer = new RunnableTracer();
  const metrics = new MetricsHandler();

  const prompt = PromptTemplate.fromTemplate("翻译成英文：{text}");
  const model = new ChatOpenAI({ temperature: 0 });
  const parser = new StringOutputParser();

  const chain = RunnableSequence.from([prompt, model, parser]);

  console.log("🎯 任务：翻译中文到英文\n");
  console.log("📊 同时启用链路追踪和指标收集：\n");

  const texts = [
    "你好，世界",
    "前端工程师",
    "人工智能",
  ];

  for (const text of texts) {
    console.log(`\n🔍 正在翻译：${text}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const result = await chain.invoke(
      { text },
      {
        callbacks: [tracer, metrics], // 🔑 关键：同时使用多个 Callback
      }
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  // 打印指标摘要
  metrics.printSummary();
}

async function demoParallelRunnable() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          并行 Runnable 追踪                                     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const tracer = new RunnableTracer();

  const model = new ChatOpenAI({ temperature: 0.7 });

  // 创建三个并行任务
  const tasks = {
    frontend: model.pipe(new StringOutputParser()),
    backend: model.pipe(new StringOutputParser()),
    devops: model.pipe(new StringOutputParser()),
  };

  console.log("🎯 任务：并行生成三个领域的学习建议\n");
  console.log("📊 执行链路（并行）：\n");

  const results = await Promise.all([
    tasks.frontend.invoke("给前端工程师 3 条学习建议", { callbacks: [tracer] }),
    tasks.backend.invoke("给后端工程师 3 条学习建议", { callbacks: [tracer] }),
    tasks.devops.invoke("给 DevOps 工程师 3 条学习建议", { callbacks: [tracer] }),
  ]);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 最终结果：\n");
  console.log("前端：", results[0], "\n");
  console.log("后端：", results[1], "\n");
  console.log("DevOps：", results[2], "\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function run() {
  try {
    // 演示 1：简单链路追踪
    await demoSimpleRunnableChain();

    // 演示 2：嵌套链路追踪（Run 树）
    await demoNestedRunnableChain();

    // 演示 3：组合多个 Callback
    await demoWithMetricsAndTracer();

    // 演示 4：并行 Runnable 追踪
    await demoParallelRunnable();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Runnable 是 LangChain 的核心抽象，所有组件都是 Runnable");
    console.log("2. 通过 Callback 可以追踪 Runnable 的执行链路");
    console.log("3. 嵌套的 Runnable 会形成 Run 树，通过 runId 和 parentRunId 关联");
    console.log("4. 可以同时使用多个 Callback 实现不同功能");
    console.log("5. 链路追踪对于调试复杂链路、性能分析非常有帮助");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
