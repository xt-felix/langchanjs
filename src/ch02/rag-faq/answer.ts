import { RunnableSequence } from "@langchain/core/runnables";
import { answerPrompt } from "./prompt";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { simpleRetriever } from "./retriever";

import * as dotenv from "dotenv";
dotenv.config();

/**
 * 问答结果类型定义
 */
export interface QAResult {
  answer: string;
  citations: Array<{
    source: string;
    chunkId: string;
  }>;
  confidence: number;
}

/**
 * 问答输入类型
 */
export interface QAInput {
  question: string;
}

/**
 * 构建问答链路
 * 
 * 链路流程：
 * 1. 接收用户问题
 * 2. 使用检索器获取相关文档片段
 * 3. 将问题和片段传入 Prompt 模板
 * 4. 调用 LLM 生成答案
 * 5. 解析为结构化 JSON 输出
 * 
 * @param retriever - 检索器函数（可选，默认使用 simpleRetriever）
 * @param modelConfig - 模型配置（可选）
 * @returns RunnableSequence 链路
 */
export function buildQAChain(
  retriever: (q: string) => Promise<string> = simpleRetriever,
  modelConfig?: {
    temperature?: number;
    modelName?: string;
  }
) {
  // 初始化模型
  const model = new ChatOpenAI({
    temperature: modelConfig?.temperature ?? 0, // 低温度保证回答的确定性
    modelName: modelConfig?.modelName ?? "gpt-3.5-turbo",
  });

  // 初始化 JSON 解析器
  const parser = new JsonOutputParser<QAResult>();

  // 构建链路
  const chain = RunnableSequence.from([
    // 步骤 1: 接收输入并执行检索
    async (input: QAInput) => {
      console.log(`\n[检索阶段] 查询: ${input.question}`);
      const chunks = await retriever(input.question);
      console.log(`[检索阶段] 检索到 ${chunks.length > 0 ? "相关" : "无"} 片段`);
      return {
        question: input.question,
        chunks,
      };
    },

    // 步骤 2: 填充 Prompt 模板
    answerPrompt,

    // 步骤 3: 调用 LLM
    model,

    // 步骤 4: 解析 JSON 输出
    parser,
  ]);

  return chain;
}

/**
 * 构建流式问答链路（用于实时输出）
 * 注意：流式输出时 JSON 解析可能不完整，建议用于最终展示
 */
export function buildStreamingQAChain(
  retriever: (q: string) => Promise<string> = simpleRetriever,
  modelConfig?: {
    temperature?: number;
    modelName?: string;
  }
) {
  const model = new ChatOpenAI({
    temperature: modelConfig?.temperature ?? 0,
    modelName: modelConfig?.modelName ?? "gpt-3.5-turbo",
    streaming: true, // 启用流式输出
  });

  // 流式链路不使用 JSON 解析器，直接返回字符串流
  const chain = RunnableSequence.from([
    async (input: QAInput) => {
      const chunks = await retriever(input.question);
      return {
        question: input.question,
        chunks,
      };
    },
    answerPrompt,
    model,
  ]);

  return chain;
}

/**
 * 便捷的问答函数
 * 
 * @param question - 用户问题
 * @param options - 可选配置
 * @returns 问答结果
 */
export async function askQuestion(
  question: string,
  options?: {
    retriever?: (q: string) => Promise<string>;
    temperature?: number;
    modelName?: string;
    topK?: number;
  }
): Promise<QAResult> {
  // 如果提供了 topK，创建一个包装的检索器
  const retriever = options?.retriever
    ? options.retriever
    : async (q: string) => simpleRetriever(q, options?.topK);

  const chain = buildQAChain(retriever, {
    temperature: options?.temperature,
    modelName: options?.modelName,
  });

  const result = await chain.invoke({ question });
  return result;
}

/**
 * 批量问答
 * 
 * @param questions - 问题数组
 * @param options - 可选配置
 * @returns 问答结果数组
 */
export async function askQuestions(
  questions: string[],
  options?: {
    retriever?: (q: string) => Promise<string>;
    temperature?: number;
    modelName?: string;
  }
): Promise<QAResult[]> {
  const chain = buildQAChain(options?.retriever, {
    temperature: options?.temperature,
    modelName: options?.modelName,
  });

  // 批量处理
  const results = await Promise.all(
    questions.map((question) => chain.invoke({ question }))
  );

  return results;
}

/**
 * 格式化问答结果为可读字符串
 * 
 * @param result - 问答结果
 * @returns 格式化的字符串
 */
export function formatQAResult(result: QAResult): string {
  const confidenceBar = "█".repeat(Math.round(result.confidence * 10));
  const confidencePercent = (result.confidence * 100).toFixed(0);

  let output = `\n${"=".repeat(60)}\n`;
  output += `回答：\n${result.answer}\n\n`;
  output += `置信度：${confidenceBar} ${confidencePercent}%\n\n`;

  if (result.citations && result.citations.length > 0) {
    output += `来源引用：\n`;
    result.citations.forEach((citation, index) => {
      output += `  ${index + 1}. [${citation.chunkId}] ${citation.source}\n`;
    });
  } else {
    output += `来源引用：无\n`;
  }

  output += `${"=".repeat(60)}\n`;

  return output;
}

