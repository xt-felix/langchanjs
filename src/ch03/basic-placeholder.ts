/**
 * 基础示例：使用 MessagesPlaceholder 注入历史对话
 * 
 * 核心概念：
 * - MessagesPlaceholder 是 LangChain 提供的占位符，用于在 Prompt 中注入历史消息
 * - 历史消息可以从 Memory 系统加载，实现多轮对话的上下文连续性
 * 
 * 本示例通过对比展示历史对话的作用：
 * 1. 没有历史：AI 无法理解上下文，回答不连贯
 * 2. 有历史：AI 可以基于上下文，回答连贯且准确
 */

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * 创建包含历史消息占位符的 Prompt 模板
 */
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是简洁的前端顾问，擅长性能优化和用户体验提升。"],
  new MessagesPlaceholder("history"), // 历史消息占位符
  ["human", "{input}"], // 当前用户输入
]);

/**
 * 构建处理链
 */
const model = new ChatOpenAI({ temperature: 0 });
const chain = prompt.pipe(model).pipe(new StringOutputParser());

/**
 * 运行对话函数
 * 
 * @param history - 历史消息数组，格式：[{ role: "human" | "ai" | "system", content: string }]
 * @param input - 当前用户输入
 */
export async function run(history: Array<{ role: string; content: string }>, input: string) {
  const out = await chain.invoke({ history, input });
  return out;
}

/**
 * 演示：对比有无历史对话的区别
 */
if (require.main === module) {
  (async () => {
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║      MessagesPlaceholder 历史对话作用演示                      ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    // ========== 场景 1：没有历史对话 ==========
    console.log("【场景 1】没有历史对话（AI 无法理解上下文）\n");
    console.log("用户问题：\"继续说说图片优化\"");
    console.log("历史对话：无\n");

    const noHistory: Array<{ role: string; content: string }> = [];
    const answer1 = await run(noHistory, "继续说说图片优化");
    
    console.log("AI 回答（无历史）:");
    console.log(answer1);
    console.log("\n❌ 问题：AI 不知道'继续'指的是什么，回答不连贯\n");
    console.log("─".repeat(60));
    console.log("\n");

    // ========== 场景 2：有历史对话 ==========
    console.log("【场景 2】有历史对话（AI 可以理解上下文）\n");
    console.log("用户问题：\"继续说说图片优化\"");
    console.log("历史对话：");
    console.log("  用户: 我们刚讨论了首屏优化");
    console.log("  AI: 首屏优化主要包括：减少关键资源大小、延迟加载非关键资源、使用 CDN 加速等。");
    console.log("  用户: 图片优化有哪些方法？");
    console.log("  AI: 图片优化包括：使用 WebP 格式、懒加载、响应式图片、图片压缩等。\n");

    const withHistory: Array<{ role: string; content: string }> = [
      { role: "human", content: "我们刚讨论了首屏优化" },
      { role: "ai", content: "首屏优化主要包括：减少关键资源大小、延迟加载非关键资源、使用 CDN 加速等。" },
      { role: "human", content: "图片优化有哪些方法？" },
      { role: "ai", content: "图片优化包括：使用 WebP 格式、懒加载、响应式图片、图片压缩等。" },
    ];
    
    const answer2 = await run(withHistory, "继续说说图片优化");
    
    console.log("AI 回答（有历史）:");
    console.log(answer2);
    console.log("\n✅ 优势：AI 知道'继续'指的是图片优化，可以给出更深入的答案\n");
    console.log("─".repeat(60));
    console.log("\n");

    // ========== 场景 3：引用历史信息 ==========
    console.log("【场景 3】引用历史信息（AI 可以回忆之前的讨论）\n");
    console.log("用户问题：\"我们之前讨论过哪些优化策略？\"");
    console.log("历史对话：包含多轮关于性能优化的讨论\n");

    const history3: Array<{ role: string; content: string }> = [
      { role: "human", content: "页面白屏如何排查？" },
      { role: "ai", content: "白屏排查：检查网络请求、资源加载、JavaScript 错误、CSS 阻塞等。" },
      { role: "human", content: "如何用懒加载优化首屏？" },
      { role: "ai", content: "懒加载优化：延迟加载图片、视频、非关键脚本，使用 Intersection Observer API。" },
      { role: "human", content: "图片该如何处理？" },
      { role: "ai", content: "图片处理：使用 WebP 格式、响应式图片、CDN 加速、适当压缩。" },
    ];

    const answer3 = await run(history3, "我们之前讨论过哪些优化策略？");
    
    console.log("AI 回答（引用历史）:");
    console.log(answer3);
    console.log("\n✅ 优势：AI 可以总结之前讨论的所有优化策略\n");
    console.log("─".repeat(60));
    console.log("\n");

    // ========== 场景 4：上下文连贯性 ==========
    console.log("【场景 4】上下文连贯性（AI 理解对话的连续性）\n");
    console.log("用户问题：\"那脚本优化呢？\"");
    console.log("历史对话：刚讨论过图片优化\n");

    const history4: Array<{ role: string; content: string }> = [
      { role: "human", content: "图片优化有哪些方法？" },
      { role: "ai", content: "图片优化包括：使用 WebP 格式、懒加载、响应式图片、图片压缩等。" },
    ];

    const answer4 = await run(history4, "那脚本优化呢？");
    
    console.log("AI 回答（上下文连贯）:");
    console.log(answer4);
    console.log("\n✅ 优势：AI 理解'那'指的是从图片优化转到脚本优化，回答自然连贯\n");
    console.log("─".repeat(60));
    console.log("\n");

    // ========== 总结 ==========
    console.log("📊 总结：历史对话的作用\n");
    console.log("1. ✅ 上下文理解：AI 知道'继续'、'那'等指代词的含义");
    console.log("2. ✅ 信息连贯：可以引用之前讨论的内容");
    console.log("3. ✅ 对话自然：回答更符合人类对话习惯");
    console.log("4. ✅ 减少重复：不需要每次都重新说明背景");
    console.log("\n💡 这就是为什么需要 Memory 系统！\n");
  })();
}

