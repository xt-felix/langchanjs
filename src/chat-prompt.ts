// 文件：src/ch02/chat-prompt.ts
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";

dotenv.config();

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是资深前端教练，善于用类比解释复杂概念。"],
  ["human", "请用类比解释 {topic}，并提供一个代码示例。"],
]);

const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
const chain = chatPrompt.pipe(model).pipe(new StringOutputParser());

export async function run() {
  const text = await chain.invoke({ topic: "虚拟 DOM" });
  console.log(text);
}

if (require.main === module) { run(); }
