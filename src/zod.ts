// 文件：src/ch02/zod-output.ts
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

import * as dotenv from "dotenv";
dotenv.config();

const schema = z.object({
  title: z.string(),
  tags: z.array(z.string()).max(5),
  estimateHours: z.number().min(1).max(80),
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const prompt = PromptTemplate.fromTemplate(`
基于需求生成任务卡片：
需求：{requirement}
请严格输出：
{format_instructions}
`);

const chain = prompt.pipe(new ChatOpenAI({ temperature: 0 })).pipe(parser);

export async function run() {
  const out = await chain.invoke({
    requirement: "实现文章阅读进度统计与收藏功能",
    format_instructions: parser.getFormatInstructions(),
  });
  console.log(out);
}

if (require.main === module) { run(); }
