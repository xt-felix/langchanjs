// 文件：src/ch02/few-shot.ts
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
dotenv.config();

const examplePrompt = PromptTemplate.fromTemplate(
  "用户：{input}\n分类：{label}"
);

const examples = [
  { input: "页面加载很慢", label: "性能问题" },
  { input: "按钮点击没反应", label: "交互缺陷" },
  { input: "接口经常 500", label: "后端故障" },
];

const fewShot = new FewShotPromptTemplate({
  examples,
  examplePrompt,
  prefix: "请根据用户诉求给出标签（性能问题/交互缺陷/后端故障）：",
  suffix: "用户：{input}\n分类：",
  inputVariables: ["input"],
});

const chain = fewShot.pipe(new ChatOpenAI()).pipe(new StringOutputParser());

export async function run() {
  const out = await chain.invoke({ input: "首屏白屏 3 秒" });
  console.log(out);
}

if (require.main === module) { run(); }
