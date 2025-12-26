// 文件：src/ch04/cancel.ts
// 演示：取消和超时控制（AbortController）

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import "dotenv/config";

/**
 * 🎯 示例：取消与超时控制
 *
 * 为什么需要取消功能？
 * 1. 用户体验：用户可能中途改变主意，不想等待结果
 * 2. 资源控制：避免无意义的 API 调用和费用
 * 3. 异常处理：请求超时或网络问题时需要中断
 *
 * 如何实现取消？
 * 使用 AbortController API：
 * 1. 创建 AbortController 实例
 * 2. 在 invoke() 时传入 signal
 * 3. 调用 abort() 方法取消请求
 *
 * 超时控制：
 * - 在创建 Model 时设置 timeout 参数
 * - 或通过 AbortController + setTimeout 实现
 */

async function demoBasicCancel() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              基础取消功能演示                                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });

  // 创建 AbortController
  const controller = new AbortController();

  console.log("🚀 开始请求：写一篇关于前端架构的长文章...");
  console.log("⏰ 200ms 后将自动取消\n");

  // 200ms 后取消请求
  setTimeout(() => {
    console.log("🛑 发送取消信号...");
    controller.abort();
  }, 200);

  try {
    const promise = model.invoke(
      "请写一篇关于前端架构演进的详细文章，包括 MVC、MVVM、Flux、Redux 等模式的介绍",
      {
        signal: controller.signal, // 🔑 关键：传入 signal
      }
    );

    await promise;
    console.log("✅ 请求完成（不应该到达这里）");
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("abort")) {
        console.log("\n✅ 请求已成功取消");
        console.log("💡 这避免了不必要的等待和费用\n");
      } else {
        console.error("❌ 其他错误：", error.message);
      }
    }
  }
}

async function demoStreamCancel() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          流式输出 + 取消（打字到一半停止）                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true,
  });

  const controller = new AbortController();

  console.log("🚀 开始流式输出...");
  console.log("⏰ 1 秒后将自动取消\n");
  console.log("💬 AI 回答：\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 1 秒后取消
  setTimeout(() => {
    console.log("\n\n🛑 取消流式输出...");
    controller.abort();
  }, 1000);

  try {
    const stream = await model.stream(
      "请详细介绍 React、Vue、Angular 这三大前端框架的特点、优势和适用场景",
      {
        signal: controller.signal,
      }
    );

    for await (const chunk of stream) {
      process.stdout.write(chunk.content);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ 流式输出完成（不应该到达这里）");
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("abort")) {
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("\n✅ 流式输出已取消");
        console.log("💡 观察：输出在中途停止，避免了完整生成的费用\n");
      } else {
        console.error("❌ 其他错误：", error.message);
      }
    }
  }
}

async function demoTimeout() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              超时控制（Model 级别）                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 方式 1：在创建 Model 时设置超时时间
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    timeout: 5000, // 🔑 关键：设置 5 秒超时
  });

  console.log("🚀 开始请求（设置 5 秒超时）...");
  console.log("📝 问题：一个简单的问题（应该在 5 秒内完成）\n");

  try {
    const result = await model.invoke("用一句话介绍 TypeScript");
    console.log("✅ 成功响应：", result.content);
    console.log("💡 这个请求在超时时间内完成\n");
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ 请求超时或出错：", error.message);
    }
  }
}

async function demoCustomTimeout() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          自定义超时控制（AbortController + setTimeout）        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });

  const controller = new AbortController();
  const timeoutMs = 100; // 100ms 超时（故意设置很短）

  console.log(`🚀 开始请求（自定义 ${timeoutMs}ms 超时）...`);

  // 设置超时
  const timeoutId = setTimeout(() => {
    console.log(`\n⏰ ${timeoutMs}ms 超时，自动取消请求`);
    controller.abort();
  }, timeoutMs);

  try {
    const result = await model.invoke(
      "请详细解释 React Hooks 的工作原理",
      {
        signal: controller.signal,
      }
    );

    // 如果成功，清除超时定时器
    clearTimeout(timeoutId);

    console.log("✅ 成功响应：", result.content);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("abort")) {
        console.log("\n❌ 请求因超时被取消");
        console.log("💡 可以通过增加超时时间或优化 Prompt 来解决\n");
      } else {
        console.error("❌ 其他错误：", error.message);
      }
    }
  }
}

async function demoRetryWithTimeout() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          超时重试机制                                           ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });

  const maxRetries = 3;
  const timeoutMs = 500; // 500ms 超时

  console.log(`📝 配置：最多重试 ${maxRetries} 次，每次超时 ${timeoutMs}ms\n`);

  for (let i = 0; i < maxRetries; i++) {
    console.log(`🔄 第 ${i + 1} 次尝试...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const result = await model.invoke("用一句话介绍 WebAssembly", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`✅ 成功响应：${result.content}\n`);
      break; // 成功后跳出循环
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message.includes("abort")) {
          console.log(`❌ 第 ${i + 1} 次尝试超时`);

          if (i < maxRetries - 1) {
            console.log(`⏳ 等待 1 秒后重试...\n`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            console.log(`\n❌ 已达到最大重试次数，放弃请求\n`);
          }
        } else {
          console.error(`❌ 其他错误：${error.message}`);
          break;
        }
      }
    }
  }
}

async function demoUserCancelSimulation() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║          模拟用户主动取消（真实场景）                           ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    streaming: true,
  });

  const controller = new AbortController();

  console.log("🚀 用户发起请求：介绍前端性能优化");
  console.log("💬 AI 开始回答...\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 模拟用户在 800ms 后点击"停止"按钮
  setTimeout(() => {
    console.log("\n\n👤 用户点击了【停止】按钮");
    controller.abort();
  }, 800);

  try {
    const stream = await model.stream(
      "请详细介绍前端性能优化的核心原则和最佳实践",
      {
        signal: controller.signal,
      }
    );

    for await (const chunk of stream) {
      process.stdout.write(chunk.content);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("abort")) {
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("\n✅ 已停止生成");
        console.log("💡 在真实应用中，这可以让用户随时中断不需要的响应\n");
      }
    }
  }
}

export async function run() {
  try {
    // 演示 1：基础取消
    await demoBasicCancel();

    // 演示 2：流式输出 + 取消
    await demoStreamCancel();

    // 演示 3：超时控制（Model 级别）
    await demoTimeout();

    // 演示 4：自定义超时控制
    await demoCustomTimeout();

    // 演示 5：超时重试机制
    await demoRetryWithTimeout();

    // 演示 6：模拟用户主动取消
    await demoUserCancelSimulation();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. 使用 AbortController 实现请求取消");
    console.log("2. 在 invoke() 时传入 controller.signal");
    console.log("3. 调用 controller.abort() 取消请求");
    console.log("4. 可以在 Model 级别设置 timeout 超时时间");
    console.log("5. 结合 setTimeout 实现自定义超时控制");
    console.log("6. 可以实现超时重试机制提高成功率");
    console.log("7. 取消功能对用户体验和成本控制都很重要");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
