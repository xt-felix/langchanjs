// 文件：src/ch04/stream-cli.ts
// 演示：流式输出到 CLI（打字机效果）

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import "dotenv/config";

/**
 * 🎯 示例：流式输出（Streaming）
 *
 * 什么是流式输出？
 * 流式输出是指 LLM 生成内容时，不等待完整结果生成完毕，
 * 而是一边生成一边返回（逐个 Token 返回），实现"打字机效果"。
 *
 * 为什么需要流式输出？
 * 1. 用户体验：用户能立即看到响应，而不是等待完整结果
 * 2. 降低感知延迟：即使总耗时相同，流式输出让用户感觉更快
 * 3. 实时监控：可以实时观察生成过程，及时中断不合适的内容
 *
 * 如何启用流式输出？
 * 1. 在创建 Model 时设置 streaming: true
 * 2. 使用 stream() 方法代替 invoke()
 * 3. 遍历返回的异步迭代器
 */

async function demoBasicStreaming() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              基础流式输出演示（打字机效果）                     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 创建支持流式输出的模型
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true, // 🔑 关键：启用流式输出
  });

  console.log("📝 问题：请用 3 句话介绍 LangChain.js\n");
  console.log("💬 AI 回答（实时输出）：\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 2. 使用 stream() 方法获取流式输出
  const stream = await model.stream("请用 3 句话介绍 LangChain.js，适合前端工程师理解");

  // 3. 遍历流，逐个输出 Token
  for await (const chunk of stream) {
    // chunk.content 包含当前这个 Token 的内容
    process.stdout.write(chunk.content);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ 流式输出完成\n");
}

async function demoStreamWithMetrics() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          流式输出 + 指标收集（Token 计数、耗时）               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true,
  });

  const question = "解释一下前端性能优化的核心原则，用简洁的语言说明";

  console.log(`📝 问题：${question}\n`);
  console.log("💬 AI 回答（实时输出 + 指标监控）：\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const startTime = Date.now();
  let tokenCount = 0;
  let charCount = 0;
  let fullContent = "";

  const stream = await model.stream(question);

  for await (const chunk of stream) {
    const content = chunk.content;
    fullContent += content;
    tokenCount++;
    charCount += content.length;

    // 实时输出
    process.stdout.write(content);
  }

  const duration = Date.now() - startTime;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📊 指标统计：");
  console.log(`   - Token 数量: ${tokenCount} 个`);
  console.log(`   - 字符数量: ${charCount} 个`);
  console.log(`   - 总耗时: ${duration}ms`);
  console.log(`   - 平均速度: ${(tokenCount / (duration / 1000)).toFixed(2)} tokens/s`);
  console.log(`   - 首 Token 延迟: ~${Math.min(duration / tokenCount, duration).toFixed(0)}ms\n`);
}

async function demoStreamWithPrompt() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          结合 Prompt 模板的流式输出                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 创建 Prompt 模板
  const prompt = PromptTemplate.fromTemplate(`
你是一个简洁的技术解释专家。请用 3 句话解释以下概念：

概念：{concept}

要求：
- 第一句：定义是什么
- 第二句：为什么重要
- 第三句：如何使用

解释：
  `.trim());

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true,
  });

  // 构建流式处理链
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const concepts = ["虚拟 DOM", "闭包", "事件循环"];

  for (const concept of concepts) {
    console.log(`\n🔍 正在解释：${concept}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💬 ");

    const stream = await chain.stream({ concept });

    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }

    console.log("\n");
  }

  console.log("\n✅ 所有概念解释完成\n");
}

async function compareStreamingVsNonStreaming() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          对比：流式 vs 非流式                                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const question = "用 5 句话介绍 React Hooks 的核心思想";

  // 非流式
  console.log("【方式 1】非流式输出：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const modelNonStream = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: false,
  });

  console.log("⏳ 正在等待完整响应...");
  const startNonStream = Date.now();
  const resultNonStream = await modelNonStream.invoke(question);
  const durationNonStream = Date.now() - startNonStream;

  console.log(`💬 ${resultNonStream.content}`);
  console.log(`⏱️  耗时: ${durationNonStream}ms`);
  console.log("❌ 问题：用户需要等待完整结果才能看到内容\n");

  // 流式
  console.log("\n【方式 2】流式输出：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const modelStream = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true,
  });

  console.log("💬 实时响应：");
  const startStream = Date.now();
  const stream = await modelStream.stream(question);

  let firstTokenTime: number | null = null;

  for await (const chunk of stream) {
    if (!firstTokenTime) {
      firstTokenTime = Date.now();
      console.log(`⚡ 首 Token 延迟: ${firstTokenTime - startStream}ms\n`);
    }
    process.stdout.write(chunk.content);
  }

  const durationStream = Date.now() - startStream;
  console.log(`\n\n⏱️  总耗时: ${durationStream}ms`);
  console.log("✅ 优势：用户立即看到响应，体验更好\n");

  console.log("\n📊 对比总结：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("| 指标           | 非流式            | 流式              |");
  console.log("|----------------|-------------------|-------------------|");
  console.log(`| 首次响应延迟   | ${durationNonStream}ms | ${firstTokenTime ? firstTokenTime - startStream : "N/A"}ms |`);
  console.log(`| 总耗时         | ${durationNonStream}ms | ${durationStream}ms |`);
  console.log("| 用户体验       | 需要等待完整结果  | 立即看到响应      |");
  console.log("| 适用场景       | 批量处理          | 实时交互          |");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function run() {
  try {
    // 演示 1：基础流式输出
    await demoBasicStreaming();

    // 演示 2：流式输出 + 指标收集
    await demoStreamWithMetrics();

    // 演示 3：结合 Prompt 模板
    await demoStreamWithPrompt();

    // 演示 4：对比流式 vs 非流式
    await compareStreamingVsNonStreaming();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. 流式输出通过 streaming: true 启用，使用 stream() 方法");
    console.log("2. 流式输出显著降低首次响应延迟，提升用户体验");
    console.log("3. 可以在流式输出时收集指标（Token 数、耗时等）");
    console.log("4. 流式输出适合实时交互场景，非流式适合批量处理");
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
