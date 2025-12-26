// 文件：src/ch05/sequence-basic.ts
// 演示：最基础的 Runnable 流水线（Prompt → Model → Parser）

import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import "dotenv/config";

/**
 * 🎯 示例：最小可用流水线
 *
 * 什么是 Runnable？
 * Runnable 是 LangChain.js 的核心抽象，代表一个"可执行单元"。
 * 所有的 Prompt、Model、Parser、Retriever、Tool 都实现了 Runnable 接口。
 *
 * Runnable 的核心方法：
 * - invoke(input): 单次执行，返回结果
 * - stream(input): 流式执行，返回异步迭代器
 * - batch(inputs): 批量执行，返回结果数组
 * - pipe(next): 串联下一个 Runnable，形成链
 *
 * 为什么需要 Runnable？
 * 1. 统一接口：所有组件都用同样的方式调用
 * 2. 可组合：通过 pipe() 轻松串联
 * 3. 可测试：每个环节都可以独立测试
 * 4. 可观测：统一的 Callback 机制
 */

async function demoBasicPipeline() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              最基础的 Runnable 流水线                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 创建 Prompt 模板（Runnable）
  const prompt = PromptTemplate.fromTemplate(
    "你是{role}，请对下面内容给出要点总结（3-5条）：\n\n{content}"
  );

  // 2. 创建 LLM 模型（Runnable）
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  // 3. 创建输出解析器（Runnable）
  const parser = new StringOutputParser();

  // 4. 使用 pipe() 串联成处理链
  // 数据流：Input → Prompt → Model → Parser → Output
  const chain = prompt.pipe(model).pipe(parser);

  console.log("📊 流水线结构：");
  console.log("   Input {role, content}");
  console.log("     ↓");
  console.log("   Prompt Template (格式化输入)");
  console.log("     ↓");
  console.log("   LLM Model (生成回答)");
  console.log("     ↓");
  console.log("   String Parser (提取文本)");
  console.log("     ↓");
  console.log("   Output (string)\n");

  // 5. 执行流水线
  const input = {
    role: "技术作者",
    content: `
React 18 引入了并发特性（Concurrent Features），这是 React 架构的一次重大升级。
主要包括：Automatic Batching（自动批处理）、Transitions（过渡）、Suspense（悬念）等。
这些特性让 React 应用能够保持响应性，即使在处理大量更新时也能流畅运行。
开发者可以通过 useTransition 和 useDeferredValue 来标记非紧急更新，
让 React 优先处理用户交互，提升用户体验。
    `.trim(),
  };

  console.log("📝 输入：");
  console.log(`   角色：${input.role}`);
  console.log(`   内容：${input.content.slice(0, 100)}...\n`);

  console.log("🔄 执行中...\n");

  const output = await chain.invoke(input);

  console.log("✅ 输出结果：");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(output);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function demoStepByStep() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          逐步执行：观察每个 Runnable 的输入输出               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const prompt = PromptTemplate.fromTemplate("解释概念：{concept}");
  const model = new ChatOpenAI({ temperature: 0 });
  const parser = new StringOutputParser();

  const input = { concept: "虚拟 DOM" };

  console.log("📝 原始输入：", input, "\n");

  // 步骤 1：Prompt 格式化
  console.log("🔸 步骤 1：Prompt 格式化");
  const promptOutput = await prompt.invoke(input);
  console.log("   输出类型：", promptOutput.constructor.name);
  console.log("   输出内容：", promptOutput.toString().slice(0, 100) + "...\n");

  // 步骤 2：LLM 生成
  console.log("🔸 步骤 2：LLM 生成");
  const modelOutput = await model.invoke(promptOutput);
  console.log("   输出类型：", modelOutput.constructor.name);
  console.log("   输出内容：", String(modelOutput.content).slice(0, 100) + "...\n");

  // 步骤 3：解析输出
  console.log("🔸 步骤 3：解析输出");
  const finalOutput = await parser.invoke(modelOutput);
  console.log("   输出类型：", typeof finalOutput);
  console.log("   输出内容：", finalOutput.slice(0, 100) + "...\n");

  console.log("💡 总结：");
  console.log("   每个 Runnable 都有明确的输入输出类型");
  console.log("   pipe() 会自动传递上一个 Runnable 的输出作为下一个的输入\n");
}

async function demoReusability() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          可复用性：同一个 Runnable 用于不同场景               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 创建可复用的组件
  const model = new ChatOpenAI({ temperature: 0 });
  const parser = new StringOutputParser();

  // 场景 1：技术解释
  const explainPrompt = PromptTemplate.fromTemplate("用一句话解释：{term}");
  const explainChain = explainPrompt.pipe(model).pipe(parser);

  // 场景 2：代码生成
  const codePrompt = PromptTemplate.fromTemplate("写一个 {language} 函数：{task}");
  const codeChain = codePrompt.pipe(model).pipe(parser);

  // 场景 3：翻译
  const translatePrompt = PromptTemplate.fromTemplate("翻译成英文：{text}");
  const translateChain = translatePrompt.pipe(model).pipe(parser);

  console.log("✅ 同一个 Model 和 Parser，搭配不同 Prompt 完成不同任务\n");

  console.log("🔸 任务 1：技术解释");
  const explain = await explainChain.invoke({ term: "闭包" });
  console.log(`   ${explain}\n`);

  console.log("🔸 任务 2：代码生成");
  const code = await codeChain.invoke({
    language: "TypeScript",
    task: "判断一个数是否为质数",
  });
  console.log(`   ${code.slice(0, 100)}...\n`);

  console.log("🔸 任务 3：翻译");
  const translation = await translateChain.invoke({ text: "人工智能" });
  console.log(`   ${translation}\n`);

  console.log("💡 优势：");
  console.log("   - Model 和 Parser 可以在多个场景中复用");
  console.log("   - 每个场景只需要定义不同的 Prompt");
  console.log("   - 降低代码重复，提高可维护性\n");
}

export async function run() {
  try {
    // 演示 1：基础流水线
    await demoBasicPipeline();

    // 演示 2：逐步执行
    await demoStepByStep();

    // 演示 3：可复用性
    await demoReusability();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Runnable 是 LangChain 的核心抽象");
    console.log("2. 所有组件（Prompt、Model、Parser）都实现了 Runnable 接口");
    console.log("3. 使用 pipe() 串联 Runnable，形成处理链");
    console.log("4. 每个 Runnable 都有明确的输入输出类型");
    console.log("5. Runnable 可以复用，降低代码重复");
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
