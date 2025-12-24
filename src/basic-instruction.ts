// 文件：src/ch02/basic-instruction.ts
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
dotenv.config();

const prompt = PromptTemplate.fromTemplate(`
你是一个{role}。请用{style}风格解答：
问题：{question}
要求：
- 使用分点说明
- 控制在{maxTokens}字以内
- 若不确定，请直接说“我需要更多上下文”
`);

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 0.5 });
const chain = prompt.pipe(model).pipe(new StringOutputParser());

export async function run() {
  const result = await chain.invoke({
    role: "Web 性能专家",
    style: "简洁务实",
    question: "如何优化首屏渲染？",
    maxTokens: 200,
  });
  console.log(result);
}

if (require.main === module) {
  run();
}
