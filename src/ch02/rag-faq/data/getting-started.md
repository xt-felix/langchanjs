---
category: 入门指南
tags: 安装, 配置, 快速开始
---

# LangChain.js 快速开始

## 什么是 LangChain.js？

LangChain.js 是一个专为构建大语言模型（LLM）应用而设计的 JavaScript/TypeScript 框架。它提供了一整套模块化的工具和抽象，让开发者能够轻松地将 LLM 集成到应用程序中。

### 核心优势

1. **模块化设计**：所有组件都可以独立使用或组合使用
2. **多提供商支持**：支持 OpenAI、Anthropic、Cohere、Hugging Face 等多家 LLM 提供商
3. **类型安全**：完整的 TypeScript 类型定义
4. **丰富的工具链**：从 Prompt 管理到输出解析，应有尽有
5. **活跃的社区**：定期更新，文档完善

## 安装 LangChain.js

### 使用 npm

```bash
npm install @langchain/core @langchain/openai
```

### 使用 yarn

```bash
yarn add @langchain/core @langchain/openai
```

### 使用 pnpm

```bash
pnpm add @langchain/core @langchain/openai
```

### 系统要求

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 4.5.0（如果使用 TypeScript）
- **操作系统**: Windows、macOS、Linux 均支持

## 环境配置

### 设置 API Key

创建 `.env` 文件并添加您的 API Key：

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

然后在代码中加载：

```typescript
import "dotenv/config";
```

### 基础示例

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 创建模型实例
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
});

// 创建 Prompt 模板
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有帮助的助手"],
  ["human", "{question}"],
]);

// 创建链并调用
const chain = prompt.pipe(model);
const response = await chain.invoke({
  question: "你好，世界！",
});

console.log(response);
```

## 常见问题

### Q: 支持哪些 LLM 提供商？

A: LangChain.js 支持主流的 LLM 提供商，包括：
- OpenAI (GPT-3.5, GPT-4)
- Anthropic (Claude)
- Google (PaLM, Gemini)
- Cohere
- Hugging Face
- Azure OpenAI
- 本地模型（通过 Ollama 等）

### Q: 可以在浏览器中使用吗？

A: 是的！LangChain.js 可以在 Node.js 和现代浏览器中运行。但请注意，在浏览器中直接暴露 API Key 存在安全风险，建议通过后端代理。

### Q: 需要付费吗？

A: LangChain.js 框架本身是免费开源的，但使用 LLM API（如 OpenAI）需要按照提供商的定价付费。

