// 文件：src/ch05/parallel-basic.ts
// 演示：RunnableParallel - 并行执行多个 Runnable

import { RunnableParallel, RunnableLambda } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import "dotenv/config";

/**
 * 🎯 示例：RunnableParallel（并行执行）
 *
 * 什么是 RunnableParallel？
 * RunnableParallel 可以并行执行多个 Runnable，然后将结果汇总。
 *
 * 适用场景：
 * 1. 扇出/汇聚模式（Fan-out/Fan-in）
 * 2. 同时生成多个字段
 * 3. 并行调用多个 API
 * 4. 提高处理吞吐量
 *
 * 执行流程：
 *         Input
 *           ↓
 *    ┌──────┼──────┐
 *    ↓      ↓      ↓
 *   R1     R2     R3  (并行执行)
 *    ↓      ↓      ↓
 *    └──────┼──────┘
 *           ↓
 *      { a, b, c }
 */

async function demoBasicParallel() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              RunnableParallel 基础用法                         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 创建三个简单的 Lambda
  const lengthLambda = new RunnableLambda<string, number>((text) => text.length);

  const wordCountLambda = new RunnableLambda<string, number>((text) => {
    return text.split(/\s+/).filter(Boolean).length;
  });

  const uppercaseLambda = new RunnableLambda<string, string>((text) => {
    return text.toUpperCase();
  });

  // 创建并行 Runnable
  const parallel = new RunnableParallel({
    length: lengthLambda,
    wordCount: wordCountLambda,
    uppercase: uppercaseLambda,
  });

  const input = "Hello LangChain Runnable World";

  console.log("📝 输入：", input);
  console.log("\n🔄 并行执行中...\n");

  const output = await parallel.invoke(input);

  console.log("✅ 输出：");
  console.log(JSON.stringify(output, null, 2));
  console.log("\n💡 三个 Lambda 并行执行，结果汇总成一个对象\n");
}

async function demoParallelWithLLM() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              并行调用 LLM（多角度分析）                        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({ temperature: 0.7 });
  const parser = new StringOutputParser();

  // 创建三个不同角度的分析链
  const summaryChain = PromptTemplate.fromTemplate(
    "用一句话总结：{text}"
  ).pipe(model).pipe(parser);

  const sentimentChain = PromptTemplate.fromTemplate(
    "判断情感倾向（正面/中性/负面）：{text}"
  ).pipe(model).pipe(parser);

  const keywordsChain = PromptTemplate.fromTemplate(
    "提取3个关键词（逗号分隔）：{text}"
  ).pipe(model).pipe(parser);

  // 并行执行
  const parallel = new RunnableParallel({
    summary: summaryChain,
    sentiment: sentimentChain,
    keywords: keywordsChain,
  });

  const input = {
    text: "LangChain 是一个强大的框架，让构建 LLM 应用变得简单高效。它提供了丰富的组件和清晰的抽象，开发者可以快速搭建复杂的 AI 工作流。",
  };

  console.log("📝 输入文本：");
  console.log(input.text);
  console.log("\n🔄 并行执行三个分析任务...\n");

  const startTime = Date.now();
  const output = await parallel.invoke(input);
  const duration = Date.now() - startTime;

  console.log("✅ 分析结果：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📋 总结：${output.summary}`);
  console.log(`😊 情感：${output.sentiment}`);
  console.log(`🏷️  关键词：${output.keywords}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`⏱️  耗时：${duration}ms（并行执行）`);
  console.log("\n💡 如果串行执行，耗时会是 3 倍\n");
}

async function demoFanOutFanIn() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              扇出/汇聚模式                                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 步骤 1：扇出 - 并行处理
  const analyzeParallel = new RunnableParallel({
    length: new RunnableLambda<string, number>((text) => text.length),
    words: new RunnableLambda<string, string[]>((text) =>
      text.split(/\s+/).filter(Boolean)
    ),
    hasNumbers: new RunnableLambda<string, boolean>((text) => /\d/.test(text)),
  });

  // 步骤 2：汇聚 - 合并结果
  const mergeLambda = new RunnableLambda<
    { length: number; words: string[]; hasNumbers: boolean },
    { summary: string; details: any }
  >((input) => {
    return {
      summary: `文本包含 ${input.words.length} 个单词，${input.length} 个字符`,
      details: input,
    };
  });

  // 组合成完整流水线
  const pipeline = analyzeParallel.pipe(mergeLambda);

  console.log("📊 流水线结构：");
  console.log("   Input (string)");
  console.log("        ↓");
  console.log("   ┌────┼────┐");
  console.log("   ↓    ↓    ↓  (扇出)");
  console.log(" length words hasNumbers");
  console.log("   ↓    ↓    ↓");
  console.log("   └────┼────┘");
  console.log("        ↓  (汇聚)");
  console.log("    { summary, details }\n");

  const input = "LangChain 2024 makes AI apps easy";
  console.log("📝 输入：", input, "\n");

  const output = await pipeline.invoke(input);

  console.log("✅ 输出：");
  console.log(JSON.stringify(output, null, 2));
  console.log();
}

async function demoPerformanceComparison() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              性能对比：串行 vs 并行                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 模拟耗时操作
  const slowTask = (name: string, ms: number) =>
    new RunnableLambda<string, string>(async (input) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return `${name}: ${input}`;
    });

  const task1 = slowTask("Task1", 300);
  const task2 = slowTask("Task2", 300);
  const task3 = slowTask("Task3", 300);

  const input = "test";

  // 串行执行
  console.log("🔸 串行执行：");
  const serialStart = Date.now();
  const r1 = await task1.invoke(input);
  const r2 = await task2.invoke(input);
  const r3 = await task3.invoke(input);
  const serialDuration = Date.now() - serialStart;
  console.log(`   结果：${[r1, r2, r3].join(", ")}`);
  console.log(`   耗时：${serialDuration}ms\n`);

  // 并行执行
  console.log("🔸 并行执行：");
  const parallelStart = Date.now();
  const parallel = new RunnableParallel({
    a: task1,
    b: task2,
    c: task3,
  });
  const parallelResult = await parallel.invoke(input);
  const parallelDuration = Date.now() - parallelStart;
  console.log(`   结果：${JSON.stringify(parallelResult)}`);
  console.log(`   耗时：${parallelDuration}ms\n`);

  // 对比
  console.log("📊 性能对比：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   串行耗时：${serialDuration}ms`);
  console.log(`   并行耗时：${parallelDuration}ms`);
  console.log(`   性能提升：${((serialDuration / parallelDuration) * 100).toFixed(0)}%`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function run() {
  try {
    // 演示 1：基础并行
    await demoBasicParallel();

    // 演示 2：并行调用 LLM
    await demoParallelWithLLM();

    // 演示 3：扇出/汇聚模式
    await demoFanOutFanIn();

    // 演示 4：性能对比
    await demoPerformanceComparison();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. RunnableParallel 可以并行执行多个 Runnable");
    console.log("2. 适合扇出/汇聚模式（Fan-out/Fan-in）");
    console.log("3. 可以显著提升性能（I/O 密集型任务）");
    console.log("4. 结果会汇总成一个对象");
    console.log("5. 可以与 pipe() 结合，构建复杂流水线");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
