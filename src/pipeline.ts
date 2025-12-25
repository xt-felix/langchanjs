// 文件：src/ch02/pipeline.ts
import { PromptTemplate, PipelinePromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
dotenv.config();

const partA = PromptTemplate.fromTemplate(
  "请将主题扩写为 3 个小标题：{topic}"
);

const partB = PromptTemplate.fromTemplate(
  "基于小标题生成提纲，风格：{style}\n小标题：{headings}"
);

const pipeline = new PipelinePromptTemplate({
  finalPrompt: partB,
  pipelinePrompts: [
    { name: "headings", prompt: partA },
  ],
});

const chain = pipeline.pipe(new ChatOpenAI()).pipe(new StringOutputParser());

export async function run() {
  const result = await chain.invoke({ topic: "前端监控系统", style: "专业简练" });
  console.log(result);
}

if (require.main === module) { run(); }
