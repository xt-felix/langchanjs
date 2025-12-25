// 文件：src/ch02/callbacks.ts
import { ChatOpenAI } from "@langchain/openai";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import * as dotenv from "dotenv";
dotenv.config();

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是输出严格 JSON 的助手"],
  ["human", "给出 3 个性能优化建议，输出 JSON 数组。"],
]);

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  callbacks: [new ConsoleCallbackHandler()],
  verbose: true,
});

export async function run() {
  const res = await prompt.pipe(model).invoke({});
  console.log(res.content);
}

if (require.main === module) { run(); }
