// 文件：src/ch04/with-metrics.ts
// 演示：将自定义 CallbackHandler 注入到 Runnable 中

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { MetricsHandler } from "./metrics-callback";
import "dotenv/config";

/**
 * 🎯 示例：使用自定义 CallbackHandler
 *
 * 如何注入 Callback？
 * 1. 创建 CallbackHandler 实例
 * 2. 在 invoke() 时通过 callbacks 参数传入
 * 3. 或在创建 Model 时通过 callbacks 参数传入
 *
 * 注入位置的区别：
 * - Model 级别：只监听 LLM 相关事件
 * - Chain 级别：监听整个 Chain 的事件
 * - invoke() 级别：只监听本次调用的事件
 */

async function demoWithMetrics() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║         使用自定义 CallbackHandler 收集指标                    ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 创建自定义的指标收集器
  const metricsHandler = new MetricsHandler();

  // 2. 创建 Prompt 模板
  const prompt = PromptTemplate.fromTemplate(
    "将下面的文本翻译成英文：\n\n{text}\n\n翻译："
  );

  // 3. 创建 LLM 模型
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0, // 温度为 0，让翻译更稳定
  });

  // 4. 构建处理链
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  // 5. 执行链（注入自定义 Callback）
  console.log("📝 任务：将中文翻译成英文\n");

  const text = `
性能优化是前端工程师的核心技能之一。
我们需要关注首屏加载时间、交互响应速度和资源占用等关键指标。
通过代码分割、懒加载、缓存策略等技术手段，可以显著提升用户体验。
  `.trim();

  console.log("原文：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(text);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const result = await chain.invoke(
    { text },
    {
      callbacks: [metricsHandler], // 🔑 关键：注入自定义 Callback
      tags: ["translation", "zh-to-en"], // 可选：添加标签，便于追踪
    }
  );

  console.log("\n翻译结果：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(result);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 6. 打印收集到的指标
  metricsHandler.printSummary();
}

async function demoMultipleCalls() {
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║         多次调用的指标累积                                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const metricsHandler = new MetricsHandler();

  const prompt = PromptTemplate.fromTemplate("用一句话解释：{term}");
  const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0 });
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const terms = ["闭包", "原型链", "事件循环"];

  console.log(`📝 任务：解释 ${terms.length} 个前端概念\n`);

  for (const term of terms) {
    console.log(`\n🔍 正在解释：${term}`);
    const result = await chain.invoke(
      { term },
      { callbacks: [metricsHandler] }
    );
    console.log(`💡 ${result}\n`);
    console.log("-".repeat(70));
  }

  // 打印累积的指标
  metricsHandler.printSummary();

  console.log("\n💡 观察：");
  console.log("   - 指标会在多次调用中累积");
  console.log("   - 可以用于监控批量任务的总体消耗");
  console.log("   - 适合用于成本分析和性能优化\n");
}

async function demoModelLevelCallback() {
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║         Model 级别的 Callback（与 Model 绑定）                 ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const metricsHandler = new MetricsHandler();

  // 在创建 Model 时注入 Callback
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    callbacks: [metricsHandler], // 🔑 关键：在 Model 级别注入
  });

  const prompt = PromptTemplate.fromTemplate("写一个关于 {topic} 的俳句");
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  console.log("📝 任务：生成俳句\n");

  // 多次调用，每次都会自动使用 metricsHandler
  const topics = ["春天", "代码", "咖啡"];

  for (const topic of topics) {
    console.log(`\n🎨 主题：${topic}`);
    const result = await chain.invoke({ topic }); // 不需要再传 callbacks
    console.log(`${result}\n`);
    console.log("-".repeat(70));
  }

  metricsHandler.printSummary();

  console.log("\n💡 优势：");
  console.log("   - 不需要每次调用都传入 callbacks");
  console.log("   - 适合需要全局监控的场景");
  console.log("   - 可以与多个 Chain 共享同一个 Model\n");
}

export async function run() {
  try {
    // 演示 1：基础使用
    await demoWithMetrics();

    // 演示 2：多次调用的指标累积
    await demoMultipleCalls();

    // 演示 3：Model 级别的 Callback
    await demoModelLevelCallback();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. 自定义 CallbackHandler 可以继承 BaseCallbackHandler");
    console.log("2. 通过实现不同的事件处理方法，可以监听 LLM/Chain/Tool 的执行");
    console.log("3. Callback 可以在 Model 级别或 invoke 级别注入");
    console.log("4. 指标会在多次调用中累积，适合监控批量任务");
    console.log("5. 可以用于成本分析、性能优化、错误追踪等场景");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
    if (error instanceof Error) {
      console.error("错误信息：", error.message);
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
