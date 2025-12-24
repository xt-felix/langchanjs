import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 初始化模型
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 1000,
});

async function basicChat() {
  try {
    // 创建消息
    const messages = [
      new SystemMessage("你是一个专业的前端开发助手，擅长 JavaScript 和 React 开发。"),
      new HumanMessage("请解释什么是 React Hooks，并给出一个简单的使用示例。")
    ];

    // 发送请求并获取响应
    const response = await model.invoke(messages);

    console.log("AI 助手回复：");
    console.log(response.content);

  } catch (error) {
    console.error("发生错误：", error);
  }
}

// 运行示例
basicChat();
