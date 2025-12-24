// 文件：src/ch02/runnable-compose.ts
// 演示如何使用 RunnableSequence 组合多个 Runnable 组件

// RunnableLambda: 将普通函数包装成 Runnable，可以在链中使用
// RunnableSequence: 将多个 Runnable 组件按顺序串联成一个处理链
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
// ChatOpenAI: OpenAI 的聊天模型
import { ChatOpenAI } from "@langchain/openai";
// ChatPromptTemplate: 用于构建聊天提示词模板
import { ChatPromptTemplate } from "@langchain/core/prompts";
// StringOutputParser: 将模型输出解析为字符串
import { StringOutputParser } from "@langchain/core/output_parsers";

import * as dotenv from "dotenv";
dotenv.config();

// 步骤1: 创建一个数据预处理 Runnable
// 使用 RunnableLambda.from() 将普通函数转换为 Runnable
// 功能：清理输入文本（去除首尾空格，限制最大长度300字符）
const normalize = RunnableLambda.from((input: { q: string }) => ({
  q: input.q.trim().slice(0, 300),
}));

// 步骤2: 创建聊天提示词模板
// fromMessages 接收一个消息数组，每个消息是 [角色, 内容] 的元组
// system: 设置 AI 的角色和行为规范
// human: 用户输入，{q} 是变量占位符，会被实际输入替换
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是严谨的技术作家，输出规范化 Markdown"],
  ["human", "请回答：{q}"],
]);

// 步骤3: 使用 RunnableSequence 组合完整的处理链
// 数据流向：输入 → normalize → prompt → model → parser → 输出
// 1. normalize: 预处理输入数据
// 2. prompt: 将处理后的数据填充到提示词模板
// 3. ChatOpenAI: 发送给 OpenAI 模型生成回答（temperature=0.2 表示输出相对确定性）
// 4. StringOutputParser: 将模型响应解析为纯文本字符串
const chain = RunnableSequence.from([
  normalize,
  prompt,
  new ChatOpenAI({ temperature: 0.2 }),
  new StringOutputParser(),
]);

// 执行函数
export async function run() {
  // 调用链，传入带有前后空格的问题
  // 会经过：规范化 → 填充模板 → LLM 生成 → 解析输出
  const md = await chain.invoke({ q: "  讲讲CSR/SSR/SSG 区别  " });
  console.log(md);
}

// 如果直接运行此文件（非 import），则执行 run 函数
if (require.main === module) {
  run();
}
