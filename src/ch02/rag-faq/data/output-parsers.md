---
category: 核心功能
tags: 输出解析, JSON, 结构化数据
---

# 输出解析器

## 为什么需要输出解析器？

LLM 的原始输出通常是纯文本字符串，而在实际应用中，我们往往需要结构化的数据（如 JSON 对象、数组等）。输出解析器就是用来将 LLM 的文本输出转换为程序可以直接使用的数据结构。

## StringOutputParser

最简单的解析器，返回字符串：

```typescript
import { StringOutputParser } from "@langchain/core/output_parsers";

const parser = new StringOutputParser();

const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke(input);
// result 是 string 类型
```

## JsonOutputParser

将 LLM 输出解析为 JSON 对象：

```typescript
import { JsonOutputParser } from "@langchain/core/output_parsers";

interface Answer {
  answer: string;
  confidence: number;
  sources: string[];
}

const parser = new JsonOutputParser<Answer>();

const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke(input);
// result 是 { answer: string, confidence: number, sources: string[] }
```

### 重要提示

使用 `JsonOutputParser` 时，需要在 Prompt 中明确告诉模型输出 JSON 格式：

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `请以 JSON 格式回答：
{
  "answer": "你的回答",
  "confidence": 0.95
}`,
  ],
  ["human", "{question}"],
]);
```

## StructuredOutputParser

使用 Zod 定义严格的输出结构：

```typescript
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    answer: z.string().describe("回答内容"),
    confidence: z.number().min(0).max(1).describe("置信度"),
    tags: z.array(z.string()).describe("相关标签"),
  })
);

// 获取格式说明（插入到 Prompt 中）
const formatInstructions = parser.getFormatInstructions();

const prompt = ChatPromptTemplate.fromTemplate(
  `回答问题：{question}\n\n{format_instructions}`
);

const chain = prompt.pipe(model).pipe(parser);
```

## CommaSeparatedListOutputParser

解析逗号分隔的列表：

```typescript
import { CommaSeparatedListOutputParser } from "@langchain/core/output_parsers";

const parser = new CommaSeparatedListOutputParser();

const prompt = ChatPromptTemplate.fromTemplate(
  "列出5种编程语言，用逗号分隔"
);

const chain = prompt.pipe(model).pipe(parser);
const result = await chain.invoke({});
// result 是 string[] 类型: ["Python", "JavaScript", "Java", "Go", "Rust"]
```

## 自定义输出解析器

你可以继承 `BaseOutputParser` 创建自定义解析器：

```typescript
import { BaseOutputParser } from "@langchain/core/output_parsers";

class CustomParser extends BaseOutputParser<MyType> {
  async parse(text: string): Promise<MyType> {
    // 自定义解析逻辑
    return parsedResult;
  }

  getFormatInstructions(): string {
    return "请按照特定格式输出...";
  }
}
```

## 错误处理

当 LLM 输出格式不符合预期时，解析器会抛出错误：

```typescript
try {
  const result = await chain.invoke(input);
} catch (error) {
  console.error("解析失败:", error);
  // 可以使用重试机制或降级策略
}
```

## 最佳实践

### 1. 在 Prompt 中明确格式要求

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "必须以 JSON 格式输出，不要添加任何额外的文字解释。",
  ],
  ["human", "{question}"],
]);
```

### 2. 提供示例

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `输出格式示例：
{"answer": "示例回答", "confidence": 0.9}`,
  ],
  ["human", "{question}"],
]);
```

### 3. 使用 temperature=0

低温度可以让模型输出更加稳定和可预测：

```typescript
const model = new ChatOpenAI({
  temperature: 0, // 确保输出的一致性
});
```

### 4. 添加验证

使用 Zod 等库进行运行时验证：

```typescript
import { z } from "zod";

const ResultSchema = z.object({
  answer: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

// 验证解析结果
const validated = ResultSchema.parse(result);
```

## 常见问题

### Q: JsonOutputParser 解析失败怎么办？

A: 常见原因：
1. Prompt 中没有明确要求 JSON 格式
2. 模型输出了额外的文字（如"好的，这是 JSON："）
3. JSON 格式不合法

解决方案：
- 在 Prompt 中添加"只输出 JSON，不要任何额外文字"
- 使用 `temperature=0`
- 提供 JSON 示例

### Q: 如何处理部分解析失败？

A: 可以实现一个宽松的解析器，尝试从文本中提取 JSON 部分：

```typescript
function extractJSON(text: string): object {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error("无法提取 JSON");
}
```

### Q: 哪个解析器最适合生产环境？

A: 推荐使用 `StructuredOutputParser` + Zod，因为它提供：
- 类型安全
- 运行时验证
- 自动生成格式说明
- 详细的错误信息

