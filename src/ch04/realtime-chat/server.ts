// 文件：src/ch04/realtime-chat/server.ts
// 实战项目：实时聊天系统（模拟 SSE 流式输出）

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import "dotenv/config";

/**
 * 🎯 实战项目：实时聊天系统
 *
 * 功能特性：
 * 1. 流式输出（打字机效果）
 * 2. 实时进度上报（Token 计数、耗时）
 * 3. 错误处理和重试
 * 4. 取消功能
 * 5. 指标收集（Token 消耗、成本估算）
 *
 * 架构：
 * - 服务端：使用 Callback 收集事件，模拟 SSE 推送
 * - 客户端：订阅事件流，实时渲染
 *
 * 在真实场景中：
 * - 服务端会通过 SSE/WebSocket 推送事件
 * - 客户端会在浏览器中实时渲染
 * - 这里我们用 CLI 模拟这个过程
 */

/**
 * 事件类型定义
 */
type ChatEvent =
  | { type: "start"; sessionId: string; timestamp: number }
  | { type: "token"; content: string; index: number }
  | { type: "progress"; tokens: number; duration: number }
  | { type: "end"; totalTokens: number; duration: number; cost: number }
  | { type: "error"; message: string };

/**
 * 实时聊天回调处理器
 */
class RealtimeChatHandler extends BaseCallbackHandler {
  name = "realtime-chat-handler";

  private startTime: number = 0;
  private tokenCount: number = 0;
  private eventCallback: (event: ChatEvent) => void;

  constructor(eventCallback: (event: ChatEvent) => void) {
    super();
    this.eventCallback = eventCallback;
  }

  async handleLLMStart(): Promise<void> {
    this.startTime = Date.now();
    this.tokenCount = 0;

    // 发送开始事件
    this.eventCallback({
      type: "start",
      sessionId: Math.random().toString(36).substring(7),
      timestamp: this.startTime,
    });
  }

  async handleLLMNewToken(token: string): Promise<void> {
    this.tokenCount++;

    // 发送 Token 事件
    this.eventCallback({
      type: "token",
      content: token,
      index: this.tokenCount,
    });

    // 每 5 个 Token 发送一次进度事件
    if (this.tokenCount % 5 === 0) {
      this.eventCallback({
        type: "progress",
        tokens: this.tokenCount,
        duration: Date.now() - this.startTime,
      });
    }
  }

  async handleLLMEnd(output: LLMResult): Promise<void> {
    const duration = Date.now() - this.startTime;
    const tokenUsage = output.llmOutput?.tokenUsage;
    const totalTokens = tokenUsage?.totalTokens || 0;

    // 计算成本（基于 GPT-3.5-turbo 定价）
    const promptCost = ((tokenUsage?.promptTokens || 0) / 1000) * 0.0015;
    const completionCost = ((tokenUsage?.completionTokens || 0) / 1000) * 0.002;
    const cost = promptCost + completionCost;

    // 发送结束事件
    this.eventCallback({
      type: "end",
      totalTokens,
      duration,
      cost,
    });
  }

  async handleLLMError(err: Error): Promise<void> {
    // 发送错误事件
    this.eventCallback({
      type: "error",
      message: err.message,
    });
  }
}

/**
 * 客户端事件处理器（模拟浏览器行为）
 */
class ClientEventHandler {
  private content: string = "";
  private startTime: number = 0;

  handleEvent(event: ChatEvent): void {
    switch (event.type) {
      case "start":
        this.startTime = event.timestamp;
        this.content = "";
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🚀 会话开始");
        console.log(`   Session ID: ${event.sessionId}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log("💬 AI 回答（实时输出）：\n");
        break;

      case "token":
        this.content += event.content;
        // 打字机效果
        process.stdout.write(event.content);
        break;

      case "progress":
        // 在控制台右侧显示进度（通过特殊字符实现）
        // 在真实场景中，这会更新进度条
        break;

      case "end":
        console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅ 会话完成");
        console.log(`   总 Token 数: ${event.totalTokens}`);
        console.log(`   耗时: ${event.duration}ms`);
        console.log(`   成本: $${event.cost.toFixed(6)}`);
        console.log(`   速度: ${(event.totalTokens / (event.duration / 1000)).toFixed(2)} tokens/s`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        break;

      case "error":
        console.error("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ 错误：", event.message);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        break;
    }
  }
}

/**
 * 聊天服务
 */
class ChatService {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      streaming: true,
    });
  }

  async chat(
    question: string,
    eventCallback: (event: ChatEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const handler = new RealtimeChatHandler(eventCallback);

    const prompt = PromptTemplate.fromTemplate(`
你是一个友好、专业的技术助手。请用清晰、简洁的语言回答问题。

用户问题：{question}

回答：
    `.trim());

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());

    try {
      await chain.invoke(
        { question },
        {
          callbacks: [handler],
          signal,
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        eventCallback({
          type: "error",
          message: error.message,
        });
      }
    }
  }
}

/**
 * 演示：基础聊天
 */
async function demoBasicChat() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              实时聊天演示 1：基础对话                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const client = new ClientEventHandler();
  const service = new ChatService();

  const question = "请用 3 句话解释什么是 React Hooks，为什么它很重要？";

  console.log(`\n👤 用户问题：${question}`);

  await service.chat(question, (event) => client.handleEvent(event));
}

/**
 * 演示：多轮对话
 */
async function demoMultiTurnChat() {
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              实时聊天演示 2：多轮对话                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const client = new ClientEventHandler();
  const service = new ChatService();

  const questions = [
    "什么是虚拟 DOM？",
    "它和真实 DOM 有什么区别？",
    "如何优化虚拟 DOM 的性能？",
  ];

  for (let i = 0; i < questions.length; i++) {
    console.log(`\n👤 用户问题 ${i + 1}：${questions[i]}`);

    await service.chat(questions[i], (event) => client.handleEvent(event));

    // 等待一小段时间，模拟用户思考
    if (i < questions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

/**
 * 演示：取消功能
 */
async function demoCancelChat() {
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              实时聊天演示 3：取消功能                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const client = new ClientEventHandler();
  const service = new ChatService();
  const controller = new AbortController();

  const question = "请详细介绍前端性能优化的各个方面，包括资源优化、渲染优化、网络优化等";

  console.log(`\n👤 用户问题：${question}`);
  console.log("⏰ 1 秒后将自动取消\n");

  // 1 秒后取消
  setTimeout(() => {
    console.log("\n\n🛑 用户点击了【停止】按钮");
    controller.abort();
  }, 1000);

  await service.chat(
    question,
    (event) => client.handleEvent(event),
    controller.signal
  );
}

/**
 * 演示：错误处理和重试
 */
async function demoErrorHandling() {
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              实时聊天演示 4：错误处理和重试                    ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const client = new ClientEventHandler();
  const service = new ChatService();

  const question = "什么是 TypeScript？";
  const maxRetries = 3;

  console.log(`\n👤 用户问题：${question}`);
  console.log(`🔄 最多重试 ${maxRetries} 次\n`);

  for (let i = 0; i < maxRetries; i++) {
    console.log(`\n🔄 第 ${i + 1} 次尝试...`);

    const controller = new AbortController();

    // 模拟超时：设置一个很短的时间限制
    const timeoutId = setTimeout(() => {
      if (i < maxRetries - 1) {
        controller.abort();
      }
    }, i === maxRetries - 1 ? 30000 : 100); // 最后一次给足时间

    let success = false;

    await service.chat(
      question,
      (event) => {
        if (event.type === "end") {
          success = true;
        }
        client.handleEvent(event);
      },
      controller.signal
    );

    clearTimeout(timeoutId);

    if (success) {
      console.log("✅ 请求成功\n");
      break;
    } else {
      if (i < maxRetries - 1) {
        console.log("❌ 请求失败，准备重试...\n");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log("❌ 已达到最大重试次数\n");
      }
    }
  }
}

/**
 * 主函数
 */
export async function run() {
  try {
    // 演示 1：基础聊天
    await demoBasicChat();

    // 演示 2：多轮对话
    await demoMultiTurnChat();

    // 演示 3：取消功能
    await demoCancelChat();

    // 演示 4：错误处理和重试
    await demoErrorHandling();

    console.log("\n🎯 实战总结：");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. 通过 Callback 实现实时事件推送（模拟 SSE）");
    console.log("2. 支持流式输出、进度上报、指标收集");
    console.log("3. 实现了取消功能，提升用户体验");
    console.log("4. 实现了错误处理和重试机制，提高成功率");
    console.log("5. 在真实场景中，服务端通过 SSE/WebSocket 推送事件");
    console.log("6. 客户端在浏览器中实时渲染，实现打字机效果");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("💡 下一步：");
    console.log("   - 将这个逻辑移植到 Next.js 的 API Route");
    console.log("   - 使用 SSE 或 WebSocket 进行实时推送");
    console.log("   - 在前端实现打字机效果和进度条");
    console.log("   - 添加用户认证和会话管理");
    console.log("   - 集成 Memory 实现多轮对话\n");
  } catch (error) {
    console.error("❌ 执行出错：", error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  run();
}
