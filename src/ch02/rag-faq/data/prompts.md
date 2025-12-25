---
category: 核心功能
tags: Prompt, 提示词, 模板
---

# Prompt 模板详解

## 什么是 Prompt 模板？

Prompt 模板是 LangChain.js 中用于管理和组织提示词的核心工具。它允许你创建可复用的、参数化的提示词，避免硬编码，提高代码的可维护性。

## ChatPromptTemplate 基础用法

### 创建简单模板

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个专业的翻译助手"],
  ["human", "请将以下文本翻译成{language}：{text}"],
]);

// 使用模板
const messages = await prompt.formatMessages({
  language: "英语",
  text: "你好，世界！",
});
```

### 多轮对话模板

```typescript
const conversationPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个友好的客服机器人"],
  ["human", "我想咨询一个问题"],
  ["ai", "当然！请问有什么可以帮助您的？"],
  ["human", "{user_question}"],
]);
```

## 变量替换

Prompt 模板支持使用 `{变量名}` 语法进行变量替换：

```typescript
const greetingPrompt = ChatPromptTemplate.fromTemplate(
  "你好，{name}！欢迎来到{place}。"
);

await greetingPrompt.format({
  name: "张三",
  place: "北京",
});
// 输出: "你好，张三！欢迎来到北京。"
```

## Few-Shot 提示词

Few-shot 是通过提供示例来引导模型输出的技术：

```typescript
const fewShotPrompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个情感分析助手，分析句子的情感（正面/负面/中性）"],
  ["human", "我今天很开心！"],
  ["ai", "正面"],
  ["human", "这个产品太糟糕了。"],
  ["ai", "负面"],
  ["human", "今天是星期一。"],
  ["ai", "中性"],
  ["human", "{text}"],
]);
```

## MessagesPlaceholder

用于插入动态的消息列表：

```typescript
import { MessagesPlaceholder } from "@langchain/core/prompts";

const promptWithHistory = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有记忆的助手"],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);
```

## PromptTemplate vs ChatPromptTemplate

### PromptTemplate

用于文本补全模型（如 text-davinci-003）：

```typescript
import { PromptTemplate } from "@langchain/core/prompts";

const template = PromptTemplate.fromTemplate(
  "回答以下问题：{question}"
);
```

### ChatPromptTemplate

用于聊天模型（如 gpt-3.5-turbo、gpt-4）：

```typescript
const chatTemplate = ChatPromptTemplate.fromMessages([
  ["system", "你是助手"],
  ["human", "{question}"],
]);
```

## 最佳实践

### 1. 明确的角色定义

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一位资深的 Python 工程师，擅长代码优化和最佳实践。"],
  ["human", "{code_question}"],
]);
```

### 2. 添加约束和格式要求

```typescript
const structuredPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `你是数据分析助手。请按以下 JSON 格式回答：
{
  "answer": "你的回答",
  "confidence": 0.95,
  "sources": ["来源1", "来源2"]
}`,
  ],
  ["human", "{question}"],
]);
```

### 3. 使用示例引导输出

通过 few-shot 示例可以显著提高模型输出的质量和一致性。

### 4. 避免歧义

提示词要清晰、具体，避免模糊不清的指令。

## 常见问题

### Q: 如何处理长文本？

A: 可以使用 `TextSplitter` 将长文本分割成多个片段，然后分别处理。

### Q: 变量未提供会怎样？

A: 如果必需的变量未提供，调用时会抛出错误。可以设置默认值避免这个问题。

### Q: 可以嵌套模板吗？

A: 可以！你可以在一个模板中引用另一个模板的输出。

