// 文件：src/ch04/console-callback.ts
// 演示：使用内置的 ConsoleCallbackHandler 观察 LLM 执行过程

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import "dotenv/config";

/**
 * 🎯 示例：控制台回调（快速上手）
 *
 * 什么是 Callback？
 * Callback（回调）是 LangChain 提供的事件驱动机制，让你能够观察和响应 LLM 执行过程中的各种事件。
 *
 * 为什么需要 Callback？
 * 1. 可观测性：LLM 推理是"黑箱"，回调可以暴露执行过程
 * 2. 流式输出：实时显示生成的内容（打字机效果）
 * 3. 指标收集：记录耗时、Token 消耗、错误率等
 * 4. 调试工具：快速定位性能瓶颈和错误
 *
 * ConsoleCallbackHandler 做什么？
 * - 将 LLM 的执行过程打印到控制台
 * - 显示输入、输出、Token 消耗、耗时等信息
 * - 适合开发阶段调试使用
 */

async function demoWithConsoleCallback() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║       控制台回调演示：观察 LLM 执行过程                        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 创建 Prompt 模板
  const prompt = PromptTemplate.fromTemplate(
    "用 3 句话简洁地解释一下 {topic}，适合前端工程师理解。"
  );

  // 2. 创建 LLM 模型（启用 verbose 模式显示详细日志）
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    verbose: true, // 🔑 关键：启用详细日志模式
  });

  // 3. 创建处理链
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  // 4. 执行链
  console.log("📝 用户问题：解释虚拟列表（Virtualized List）\n");
  console.log("🔄 开始执行...\n");

  const output = await chain.invoke({
    topic: "虚拟列表（Virtualized List）",
  });

  console.log("\n✅ 最终输出：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(output);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function demoWithoutCallback() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║       对比演示：没有 Callback 的执行过程                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const prompt = PromptTemplate.fromTemplate(
    "用 3 句话简洁地解释一下 {topic}，适合前端工程师理解。"
  );

  // 不启用 verbose 模式
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    verbose: false, // 不显示详细日志
  });

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  console.log("📝 用户问题：解释虚拟 DOM（Virtual DOM）\n");

  const output = await chain.invoke({
    topic: "虚拟 DOM（Virtual DOM）",
  });

  console.log("✅ 输出：");
  console.log(output);
  console.log("\n❌ 问题：我们看不到执行过程，无法了解内部发生了什么\n");
}

export async function run() {
  try {
    // 演示 1：没有 Callback 的情况
    await demoWithoutCallback();

    console.log("\n" + "=".repeat(70) + "\n");

    // 演示 2：使用 Callback 的情况
    await demoWithConsoleCallback();

    console.log("\n💡 总结：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 使用 Callback 的优势：");
    console.log("   1. 可以看到 LLM 的输入输出");
    console.log("   2. 可以观察执行过程中的中间步骤");
    console.log("   3. 可以收集指标（Token 消耗、耗时等）");
    console.log("   4. 便于调试和优化");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
    if (error instanceof Error) {
      console.error("错误信息：", error.message);
      if (error.message.includes("API key")) {
        console.log("\n💡 提示：请确保已在 .env 文件中配置 OPENAI_API_KEY");
      }
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
