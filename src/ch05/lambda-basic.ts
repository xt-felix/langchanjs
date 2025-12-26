// 文件：src/ch05/lambda-basic.ts
// 演示：RunnableLambda - 将普通函数包装为 Runnable

import { RunnableLambda } from "@langchain/core/runnables";
import "dotenv/config";

/**
 * 🎯 示例：RunnableLambda
 *
 * 什么是 RunnableLambda？
 * RunnableLambda 可以将任意函数包装成 Runnable，让它能够：
 * - 使用 invoke()、stream()、batch() 方法
 * - 通过 pipe() 与其他 Runnable 串联
 * - 接入统一的 Callback 机制
 *
 * 适用场景：
 * 1. 数据预处理（清洗、格式化、验证）
 * 2. 自定义逻辑（计算、转换、路由）
 * 3. 外部 API 调用
 * 4. 数据库操作
 */

async function demoBasicLambda() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              RunnableLambda 基础用法                           ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 创建简单的数据清洗 Lambda
  const trimLambda = new RunnableLambda<string, string>((text) => {
    return text.trim();
  });

  const input = "   hello runnable    ";
  console.log("📝 输入：", JSON.stringify(input));

  const output = await trimLambda.invoke(input);
  console.log("✅ 输出：", JSON.stringify(output));
  console.log();
}

async function demoComplexLambda() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              复杂数据处理                                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  type Input = { text: string };
  type Output = { text: string; wordCount: number; charCount: number };

  // 创建数据统计 Lambda
  const analyzeLambda = new RunnableLambda<Input, Output>((input) => {
    const text = input.text.trim();
    const words = text.split(/\s+/).filter(Boolean);

    return {
      text,
      wordCount: words.length,
      charCount: text.length,
    };
  });

  const input = {
    text: "  LangChain makes building LLM applications easy and composable  ",
  };

  console.log("📝 输入：");
  console.log(JSON.stringify(input, null, 2));
  console.log();

  const output = await analyzeLambda.invoke(input);

  console.log("✅ 输出：");
  console.log(JSON.stringify(output, null, 2));
  console.log();
}

async function demoAsyncLambda() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              异步 Lambda（模拟 API 调用）                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 模拟异步 API 调用
  const fetchUserLambda = new RunnableLambda<string, { id: string; name: string }>(
    async (userId) => {
      console.log(`🔍 查询用户：${userId}`);

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟返回用户数据
      return {
        id: userId,
        name: `User-${userId}`,
      };
    }
  );

  console.log("📝 输入：user-123\n");

  const output = await fetchUserLambda.invoke("user-123");

  console.log("\n✅ 输出：");
  console.log(JSON.stringify(output, null, 2));
  console.log();
}

async function demoChainLambdas() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              串联多个 Lambda                                    ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 步骤 1：清理输入
  const sanitize = new RunnableLambda<string, string>((text) => {
    return text.trim().toLowerCase();
  });

  // 步骤 2：提取单词
  const tokenize = new RunnableLambda<string, string[]>((text) => {
    return text.split(/\s+/).filter(Boolean);
  });

  // 步骤 3：计数
  const count = new RunnableLambda<string[], number>((words) => {
    return words.length;
  });

  // 使用 pipe() 串联
  const pipeline = sanitize.pipe(tokenize).pipe(count);

  console.log("📊 流水线：");
  console.log("   Input (string)");
  console.log("     ↓ sanitize");
  console.log("   Cleaned (string)");
  console.log("     ↓ tokenize");
  console.log("   Words (string[])");
  console.log("     ↓ count");
  console.log("   Count (number)\n");

  const input = "   Hello World from LangChain   ";
  console.log("📝 输入：", JSON.stringify(input));

  const output = await pipeline.invoke(input);
  console.log("✅ 输出：", output);
  console.log();
}

async function demoBatch() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              批量处理（batch）                                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const uppercase = new RunnableLambda<string, string>((text) => {
    return text.toUpperCase();
  });

  const inputs = ["hello", "world", "langchain"];

  console.log("📝 输入：", inputs);

  const outputs = await uppercase.batch(inputs);

  console.log("✅ 输出：", outputs);
  console.log("\n💡 批量处理可以提高吞吐量\n");
}

async function demoErrorHandling() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              错误处理                                           ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const parseNumber = new RunnableLambda<string, number>((text) => {
    const num = parseFloat(text);
    if (isNaN(num)) {
      throw new Error(`无法解析数字：${text}`);
    }
    return num;
  });

  // 成功案例
  console.log("🔸 成功案例：");
  try {
    const result = await parseNumber.invoke("123.45");
    console.log(`   输入："123.45" → 输出：${result}\n`);
  } catch (error) {
    console.error(`   错误：${(error as Error).message}\n`);
  }

  // 失败案例
  console.log("🔸 失败案例：");
  try {
    const result = await parseNumber.invoke("not-a-number");
    console.log(`   输入："not-a-number" → 输出：${result}\n`);
  } catch (error) {
    console.error(`   ❌ 错误：${(error as Error).message}\n`);
  }

  console.log("💡 Lambda 中的错误会被传播，可以在调用方捕获处理\n");
}

export async function run() {
  try {
    // 演示 1：基础用法
    await demoBasicLambda();

    // 演示 2：复杂数据处理
    await demoComplexLambda();

    // 演示 3：异步 Lambda
    await demoAsyncLambda();

    // 演示 4：串联多个 Lambda
    await demoChainLambdas();

    // 演示 5：批量处理
    await demoBatch();

    // 演示 6：错误处理
    await demoErrorHandling();

    console.log("\n🎯 本节重点：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. RunnableLambda 可以将任意函数包装为 Runnable");
    console.log("2. 支持同步和异步函数");
    console.log("3. 可以通过 pipe() 与其他 Runnable 串联");
    console.log("4. 支持 invoke()、batch() 等统一接口");
    console.log("5. 错误会被传播，可以在调用方统一处理");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
