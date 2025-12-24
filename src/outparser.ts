// 文件：src/ch02/json-output.ts
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
dotenv.config();

type Plan = { steps: { title: string; details: string }[] };

const prompt = PromptTemplate.fromTemplate(`
你是项目规划助手。请输出严格的 JSON：
{{
  "steps": [
    {{ "title": string, "details": string }}
  ]
}}
主题：{topic}
`);

const model = new ChatOpenAI({ temperature: 0 });
const parser = new JsonOutputParser<Plan>();
const chain = prompt.pipe(model).pipe(parser);

export async function run() {
  const result = await chain.invoke({ topic: "前端监控平台搭建" });
  console.log(result.steps.map(s => `- ${s.title}`).join("\n"));
}

if (require.main === module) { run(); }
