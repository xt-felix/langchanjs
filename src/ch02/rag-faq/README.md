# FAQ RAG Chat 系统 - 完整指南

> 一个基于 LangChain.js 的智能问答系统，教你如何用 **Prompt 工程**和 **RAG 技术**构建一个既能准确回答，又能提供来源引用的智能助手。

---

## 📚 目录

- [什么是这个项目？](#什么是这个项目)
- [为什么需要 RAG？](#为什么需要-rag)
- [快速开始](#快速开始)
- [核心概念详解](#核心概念详解)
- [代码深度解析](#代码深度解析)
- [实际使用示例](#实际使用示例)
- [技术原理深入](#技术原理深入)
- [常见问题详解](#常见问题详解)
- [进阶扩展](#进阶扩展)

---

## 🎯 什么是这个项目？

### 项目简介

想象一下，你有一个产品的 FAQ（常见问题）文档库，用户经常问各种问题。传统做法是：
- ❌ 用户需要自己搜索文档
- ❌ 客服需要手动查找答案
- ❌ 答案可能不准确或不一致

这个项目实现了一个**智能问答系统**，可以：
- ✅ 自动理解用户问题
- ✅ 从文档库中检索相关信息
- ✅ 生成准确、结构化的答案
- ✅ 提供答案的来源引用
- ✅ 评估答案的可信度

### 项目能做什么？

**示例场景**：

用户问："如何安装 LangChain.js？"

系统会：
1. 🔍 在知识库中搜索与"安装"相关的文档片段
2. 📝 找到安装说明文档
3. 🤖 基于文档内容生成回答
4. 📎 提供来源引用："来自 docs/installation.md"
5. 📊 给出置信度：0.95（95% 确信）

**输出结果**：

```json
{
  "answer": "安装 LangChain.js 可以使用 npm 或 yarn。使用 npm 安装：npm install @langchain/core @langchain/openai。注意需要 Node.js 版本 >= 16.0.0。",
  "citations": [
    {"source": "docs/installation.md", "chunkId": "chunk-02"}
  ],
  "confidence": 0.95
}
```

### 项目结构说明

```
src/ch02/rag-faq/
├── prompt.ts         # 🎯 核心：定义 LLM 如何回答（最重要！）
├── retriever.ts      # 🔍 检索器：从知识库找相关文档
├── answer.ts         # 🔗 问答链路：把各个组件串联起来
├── ingest.ts         # 📥 文档加载：把文档导入知识库
├── server.ts         # 🖥️  CLI 工具：命令行测试接口
└── data/             # 📚 示例文档：用于测试的文档数据
    ├── getting-started.md
    ├── prompts.md
    ├── output-parsers.md
    └── rag-guide.md
```

**各文件的作用**（用生活比喻）：

- **prompt.ts**：就像给 AI 助手的工作手册，告诉它"必须按格式回答，不能说不知道的事"
- **retriever.ts**：就像图书管理员，帮你从书架上找到相关的书
- **answer.ts**：就像生产线，把找书、阅读、总结、格式化这些步骤串联起来
- **ingest.ts**：就像图书入库系统，把新书整理好放到书架上
- **server.ts**：就像服务台，提供测试和调试功能

---

## 🤔 为什么需要 RAG？

### 传统 LLM 的问题

**问题 1：知识过时**
- LLM 的训练数据有截止日期
- 无法获取最新信息
- 例如：GPT-3.5 不知道 2024 年的新功能

**问题 2：幻觉（Hallucination）**
- LLM 可能编造看似合理但错误的信息
- 无法区分"知道"和"不知道"
- 例如：问"LangChain.js 支持 Python 吗？"，可能回答"支持"（实际不支持）

**问题 3：无法溯源**
- 不知道答案来自哪里
- 无法验证答案的准确性
- 例如：回答正确，但不知道依据是什么

### RAG 如何解决这些问题？

**RAG = Retrieval（检索）+ Augmented（增强）+ Generation（生成）**

**工作流程**：

```
用户问题："如何安装 LangChain.js？"
    ↓
1. 检索（Retrieval）
   从知识库中找到相关文档片段
   ↓
2. 增强（Augmented）
   把文档片段和问题一起传给 LLM
   ↓
3. 生成（Generation）
   LLM 基于文档片段生成答案
   ↓
结果：准确、可追溯、低幻觉的答案
```

**优势**：

1. ✅ **知识可更新**：更新文档即可，无需重新训练模型
2. ✅ **降低幻觉**：只基于文档回答，不编造信息
3. ✅ **可追溯**：每个答案都有来源引用
4. ✅ **成本低**：无需微调大模型

---

## 🚀 快速开始

### 第一步：环境准备

#### 1.1 检查 Node.js 版本

```bash
node --version
# 需要 >= 16.0.0
```

#### 1.2 安装项目依赖

```bash
# 进入项目目录
cd langchain-tutorial

# 安装所有依赖包
npm install
```

**依赖说明**：
- `@langchain/core`：LangChain 核心库
- `@langchain/openai`：OpenAI 模型集成
- `dotenv`：环境变量管理
- `zod`：类型验证

### 第二步：配置 API Key

#### 2.1 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录或注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 Key（格式：`sk-...`）

**⚠️ 重要提示**：
- API Key 是私密信息，不要分享给他人
- 不要提交到 Git 仓库
- 如果泄露，立即在 OpenAI 平台撤销

#### 2.2 创建 .env 文件

在项目根目录（`langchain-tutorial/`）创建 `.env` 文件：

```bash
# 在项目根目录执行
echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
```

或者手动创建 `.env` 文件，内容：

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**文件位置**：
```
langchain-tutorial/
├── .env              ← 在这里创建
├── package.json
├── src/
└── ...
```

### 第三步：运行第一个示例

#### 3.1 交互模式（推荐首次使用）

```bash
npm run rag-faq
```

**这会做什么？**
- 显示欢迎信息
- 显示知识库状态（有多少文档片段）
- 自动运行 3 个示例问题：
  1. "什么是 LangChain.js？"
  2. "如何使用 Prompt 模板？"
  3. "什么是 RAG？"

**预期输出**：

```
╔════════════════════════════════════════════════════════════════╗
║            🤖 FAQ RAG Chat System 🤖                          ║
╚════════════════════════════════════════════════════════════════╝

📚 知识库状态:
   - 文档片段: 8 个
   - 来源文件: 8 个
   - 分类: 基础概念, 入门, 核心功能, 高级用法, 常见问题, 参考

📝 用户问题: 什么是 LangChain.js？

============================================================
回答：
LangChain.js 是一个用于构建大语言模型应用的框架...

置信度：██████████ 95%

来源引用：
  1. [chunk-01] docs/intro.md
============================================================
```

#### 3.2 测试单个问题

```bash
npm run rag-faq:test "如何安装 LangChain.js？"
```

**参数说明**：
- `test`：运行模式
- `"如何安装 LangChain.js？"`：你要测试的问题

**可以测试的问题**：
- "什么是 LangChain.js？"
- "如何使用 Prompt 模板？"
- "JsonOutputParser 怎么用？"
- "什么是 RAG？"
- "如何调试 LangChain 应用？"

#### 3.3 批量测试（完整评测）

```bash
npm run rag-faq:batch
```

**这会做什么？**
- 运行 35 个预设的测试问题
- 统计成功率、平均置信度
- 显示失败的问题

**预期输出**：

```
📊 测试统计
============================================================
总问题数: 35
成功: 33 (94.3%)
失败: 2
平均置信度: 82.5%
============================================================
```

#### 3.4 加载自定义文档

```bash
npm run rag-faq:ingest ./src/ch02/rag-faq/data
```

**这会做什么？**
- 扫描指定目录下的所有 `.md` 和 `.txt` 文件
- 将文档分割成小片段
- 添加到知识库中

**参数说明**：
- `ingest`：数据加载模式
- `./src/ch02/rag-faq/data`：要加载的目录路径

---

## 🧠 核心概念详解

### 1. Prompt 工程（最重要！）

#### 什么是 Prompt？

**Prompt** 就是给 AI 的"指令"或"工作说明"。就像你给员工写的工作手册，告诉它：
- 应该做什么
- 应该怎么做
- 应该输出什么格式

#### 为什么 Prompt 这么重要？

**不好的 Prompt**：
```
"回答用户问题"
```
→ AI 可能编造答案，格式不统一，无法溯源

**好的 Prompt**（本项目使用的）：
```
"你是一个严谨的 FAQ 智能助手。
1. 必须基于检索到的片段回答
2. 如果片段中没有答案，说'我不知道'
3. 必须输出 JSON 格式：
   {
     "answer": "...",
     "citations": [...],
     "confidence": 0.85
   }"
```
→ AI 会严格按照要求，输出结构化、可追溯的答案

#### 本项目的 Prompt 设计

**文件位置**：`prompt.ts`

**核心设计思路**：

1. **明确角色**：告诉 AI 它是"严谨的 FAQ 智能助手"
2. **严格约束**：必须基于文档，不能编造
3. **格式要求**：必须输出 JSON
4. **防幻觉**：无答案时明确说"不知道"

**代码解析**：

```typescript
export const answerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",  // 系统消息：定义 AI 的角色和行为
    `你是一个严谨的 FAQ 智能助手。请严格基于"检索到的片段"来回答用户问题。

**重要规则**：
1. 如果检索到的片段中没有包含答案相关信息，请明确说"我不知道"
   // ↑ 这是防幻觉的关键！告诉 AI 不要编造

2. 不要编造或推测任何信息
   // ↑ 再次强调，只能基于文档

3. 必须引用来源片段
   // ↑ 确保可追溯性

**输出格式**：
请严格输出以下 JSON 格式：
{{
  "answer": "你的回答内容",
  "citations": [
    {{"source": "来源文件路径", "chunkId": "片段标识"}}
  ],
  "confidence": 0.85
}}
// ↑ 注意：使用 {{ 和 }} 转义，因为 { } 在模板中有特殊含义
`,
  ],
  [
    "human",  // 用户消息：实际的问题和文档片段
    `用户问题：{question}
检索到的片段：{chunks}
请基于上述片段回答用户问题，并输出 JSON 格式。`,
  ],
]);
```

**为什么使用 `{{` 和 `}}`？**

在 LangChain 的模板中，`{变量名}` 用于变量替换。如果要输出字面的 `{` 和 `}`，需要转义：
- `{` → `{{`
- `}` → `}}`

**实际效果**：

当 AI 看到这个 Prompt 时，它会：
1. 理解自己的角色：严谨的 FAQ 助手
2. 知道约束：只能基于文档，不能编造
3. 知道格式：必须输出 JSON
4. 知道如何评分：给出置信度

---

### 2. 检索器（Retriever）

#### 什么是检索器？

**检索器**就像图书管理员，当用户问问题时，它会在知识库中搜索最相关的文档片段。

#### 检索过程详解

**步骤 1：用户提问**
```
用户："如何安装 LangChain.js？"
```

**步骤 2：计算相似度**

检索器会遍历知识库中的每个文档片段，计算与问题的相似度：

```typescript
// 伪代码示例
知识库 = [
  { id: "chunk-01", content: "LangChain.js 简介...", source: "intro.md" },
  { id: "chunk-02", content: "安装 LangChain.js...", source: "installation.md" },
  { id: "chunk-03", content: "Prompt 模板使用...", source: "prompts.md" },
  // ... 更多片段
]

问题 = "如何安装 LangChain.js？"

// 计算每个片段的得分
得分 = [
  { chunk: chunk-01, score: 2 },   // 包含 "LangChain.js"
  { chunk: chunk-02, score: 12 },  // 包含 "安装" + "LangChain.js"，得分最高！
  { chunk: chunk-03, score: 1 },
  // ...
]
```

**步骤 3：排序和筛选**

```typescript
// 按得分降序排序
排序后 = [
  { chunk: chunk-02, score: 12 },  // 最相关
  { chunk: chunk-01, score: 2 },
  { chunk: chunk-03, score: 1 },
]

// 取前 3 个（topK=3）
前3个 = [chunk-02, chunk-01, chunk-03]

// 过滤掉得分为 0 的（完全不相关）
最终结果 = [chunk-02, chunk-01, chunk-03]
```

**步骤 4：格式化输出**

检索器将选中的片段格式化为 Markdown 字符串，供 LLM 使用。

#### 相似度计算详解

**当前实现**（简化版，用于演示）：

```typescript
function calculateSimilarity(query: string, chunk: DocumentChunk): number {
  let score = 0;
  
  // 1. 完整查询匹配：+10 分
  // 如果查询的完整文本出现在文档中，说明高度相关
  if (chunk.content.includes(query)) {
    score += 10;
  }
  
  // 2. 标题匹配：+5 分
  // Markdown 的 # 标题通常包含关键信息
  if (chunk.content的标题.includes(query)) {
    score += 5;
  }
  
  // 3. 标签匹配：+2 分
  // 元数据中的标签如果匹配，说明分类相关
  if (chunk.metadata.tags 包含 query 中的词) {
    score += 2;
  }
  
  // 4. 单个词匹配：+1 分
  // 查询中的每个词如果在文档中出现，+1 分
  for (每个词 in query) {
    if (chunk.content.includes(词)) {
      score += 1;
    }
  }
  
  return score;
}
```

**实际例子**：

```
查询："如何安装 LangChain.js？"
文档片段："# 安装 LangChain.js\n使用 npm 安装：npm install @langchain/core..."

计算过程：
- 完整查询匹配：无（查询是问句，文档是陈述句）→ 0 分
- 标题匹配："安装 LangChain.js" 匹配 → +5 分
- 标签匹配：假设标签是 ["安装"]，匹配 → +2 分
- 词匹配：
  - "安装" 出现 → +1 分
  - "LangChain.js" 出现 → +1 分
  - "如何" 未出现 → 0 分
总分：5 + 2 + 1 + 1 = 9 分
```

**⚠️ 注意**：这是简化版实现。生产环境应该使用：
- 向量嵌入（Embeddings）
- 余弦相似度计算
- 向量数据库（Chroma、Pinecone 等）

---

### 3. RAG 链路（RunnableSequence）

#### 什么是链路？

**链路**就是把多个步骤串联起来，像工厂的生产线：
1. 原料（用户问题）进入
2. 经过多个工序（检索、生成、解析）
3. 产出成品（结构化答案）

#### 完整流程详解

**步骤 1：接收输入**

```typescript
输入：{ question: "如何安装 LangChain.js？" }
```

**步骤 2：检索文档**

```typescript
// 调用检索器
const chunks = await simpleRetriever("如何安装 LangChain.js？", 3);

// 返回格式化的文档片段
chunks = `
## 片段 1: chunk-02
**来源**: docs/installation.md
**相关度**: 12

# 安装 LangChain.js
使用 npm 安装：npm install @langchain/core @langchain/openai
...
---`
```

**步骤 3：填充 Prompt**

```typescript
// Prompt 模板
const prompt = `
用户问题：{question}
检索到的片段：{chunks}
请基于上述片段回答用户问题，并输出 JSON 格式。
`;

// 填充后的实际 Prompt
const filledPrompt = `
用户问题：如何安装 LangChain.js？
检索到的片段：
## 片段 1: chunk-02
**来源**: docs/installation.md
# 安装 LangChain.js
使用 npm 安装：npm install @langchain/core @langchain/openai
...
请基于上述片段回答用户问题，并输出 JSON 格式。
`;
```

**步骤 4：调用 LLM**

```typescript
// 发送给 OpenAI API
const llmResponse = await chatModel.invoke(filledPrompt);

// LLM 返回的原始文本
llmResponse = `{
  "answer": "安装 LangChain.js 可以使用 npm 或 yarn...",
  "citations": [{"source": "docs/installation.md", "chunkId": "chunk-02"}],
  "confidence": 0.95
}`;
```

**步骤 5：解析 JSON**

```typescript
// 使用 JsonOutputParser 解析
const parser = new JsonOutputParser<QAResult>();
const result = await parser.parse(llmResponse);

// 解析后的结构化对象
result = {
  answer: "安装 LangChain.js 可以使用 npm 或 yarn...",
  citations: [
    { source: "docs/installation.md", chunkId: "chunk-02" }
  ],
  confidence: 0.95
};
```

**步骤 6：返回结果**

```typescript
return result;  // 返回给调用者
```

#### RunnableSequence 的优势

**传统方式**（手动串联）：

```typescript
// 需要手动管理每个步骤的输入输出
const chunks = await retriever(question);
const prompt = answerPrompt.format({ question, chunks });
const llmResponse = await model.invoke(prompt);
const result = await parser.parse(llmResponse);
```

**使用 RunnableSequence**（自动串联）：

```typescript
const chain = RunnableSequence.from([
  async (input) => ({ question: input.question, chunks: await retriever(input.question) }),
  answerPrompt,
  model,
  parser,
]);

// 一步调用，自动处理中间步骤
const result = await chain.invoke({ question });
```

**优势**：
- ✅ 代码更简洁
- ✅ 类型安全（TypeScript 自动推断）
- ✅ 易于组合和扩展
- ✅ 自动处理错误传播

---

## 💻 代码深度解析

### 1. prompt.ts - Prompt 模板设计

#### 文件作用

这是整个系统的**核心**，定义了 LLM 如何回答用户问题。

#### 代码逐行解析

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 导入 LangChain 的聊天 Prompt 模板工具
// ChatPromptTemplate 用于创建多轮对话的 Prompt
```

```typescript
export const answerPrompt = ChatPromptTemplate.fromMessages([
  // fromMessages 用于创建包含多条消息的 Prompt
  // 格式：[角色, 内容]
```

```typescript
  [
    "system",  // 系统消息：定义 AI 的角色和全局行为
    `你是一个严谨的 FAQ 智能助手。
    // ↑ 明确角色：不是普通助手，而是"严谨的"FAQ 助手
    
    请严格基于"检索到的片段"来回答用户问题。
    // ↑ 核心约束：只能基于文档，不能自由发挥
```

```typescript
    **重要规则**：
    1. 如果检索到的片段中没有包含答案相关信息，请明确说"我不知道"
       // ↑ 防幻觉机制：告诉 AI 不要编造答案
    
    2. 不要编造或推测任何信息
       // ↑ 再次强调：只能基于事实
    
    3. 必须引用来源片段
       // ↑ 可追溯性：每个答案都要有来源
```

```typescript
    **输出格式**：
    请严格输出以下 JSON 格式：
    {{
      "answer": "你的回答内容",
      "citations": [
        {{"source": "来源文件路径", "chunkId": "片段标识"}}
      ],
      "confidence": 0.85
    }}
    // ↑ 使用 {{ 和 }} 转义，因为 { } 在模板中是变量占位符
```

```typescript
    **置信度评分标准**：
    - 0.9-1.0: 片段中有明确、完整的答案
    - 0.7-0.9: 片段中有相关信息，但需要轻微推理
    - 0.5-0.7: 片段中有部分相关信息
    - 0.3-0.5: 片段关联性较弱
    - 0.0-0.3: 无相关信息或不确定
    // ↑ 详细的评分标准，帮助 AI 准确评估置信度
```

```typescript
  ],
  [
    "human",  // 用户消息：实际的问题和上下文
    `用户问题：{question}
    // ↑ {question} 是变量，会被实际的问题替换
    
    检索到的片段：{chunks}
    // ↑ {chunks} 是变量，会被检索到的文档片段替换
    
    请基于上述片段回答用户问题，并输出 JSON 格式。`,
  ],
]);
```

#### 为什么这样设计？

**设计原则 1：明确角色**
- 告诉 AI 它是"严谨的 FAQ 助手"，而不是"创意写作助手"
- 这会影响 AI 的回答风格和严谨程度

**设计原则 2：严格约束**
- 多次强调"必须基于文档"
- 明确说"不知道就说不知道"
- 防止 AI 编造信息

**设计原则 3：结构化输出**
- JSON 格式便于程序处理
- 包含答案、引用、置信度三个维度
- 前端可以直接使用

**设计原则 4：详细说明**
- 置信度评分标准详细
- 帮助 AI 准确评估自己的答案

---

### 2. retriever.ts - 检索器实现

#### 文件作用

从知识库中检索与用户查询最相关的文档片段。

#### 核心函数解析

**函数 1：`simpleRetriever`**

```typescript
export async function simpleRetriever(
  query: string,        // 用户查询："如何安装 LangChain.js？"
  topK: number = 3      // 返回前 3 个最相关的片段（默认值）
): Promise<string> {    // 返回格式化的 Markdown 字符串
```

**执行流程详解**：

```typescript
// 步骤 1：计算相似度得分
const scoredChunks = faqKnowledgeBase.map((chunk) => ({
  chunk,  // 保留原始文档片段
  score: calculateSimilarity(query, chunk),  // 计算得分
}));

// 示例结果：
// [
//   { chunk: chunk-01, score: 2 },
//   { chunk: chunk-02, score: 12 },  // 安装文档，得分最高
//   { chunk: chunk-03, score: 1 },
//   ...
// ]
```

```typescript
// 步骤 2：排序、切片、过滤
const topChunks = scoredChunks
  .sort((a, b) => b.score - a.score)  // 降序排序：得分高的在前
  .slice(0, topK)                      // 取前 topK 个（默认 3 个）
  .filter((item) => item.score > 0);   // 过滤掉得分为 0 的（完全不相关）

// 示例结果（topK=3）：
// [
//   { chunk: chunk-02, score: 12 },
//   { chunk: chunk-01, score: 2 },
//   { chunk: chunk-03, score: 1 },
// ]
```

```typescript
// 步骤 3：处理空结果
if (topChunks.length === 0) {
  return "未找到相关文档片段。";
  // 如果没有相关文档，返回提示信息
  // 这样 LLM 就知道没有可用信息，会回答"我不知道"
}
```

```typescript
// 步骤 4：格式化输出
const formattedChunks = topChunks
  .map((item, index) => {
    const { chunk } = item;  // 解构：提取 chunk 对象
    return `
## 片段 ${index + 1}: ${chunk.id}
**来源**: ${chunk.source}
**相关度**: ${item.score}

${chunk.content}
---`;
  })
  .join("\n");  // 用换行符连接所有片段

return formattedChunks;
```

**输出示例**：

```markdown

## 片段 1: chunk-02
**来源**: docs/installation.md
**相关度**: 12

# 安装 LangChain.js

使用 npm 安装：
```bash
npm install @langchain/core @langchain/openai
```

或使用 yarn：
```bash
yarn add @langchain/core @langchain/openai
```

注意：需要 Node.js 版本 >= 16.0.0
---
## 片段 2: chunk-01
**来源**: docs/intro.md
**相关度**: 2

# LangChain.js 简介
LangChain.js 是一个用于构建大语言模型应用的框架...
---
```

**函数 2：`calculateSimilarity`**

```typescript
function calculateSimilarity(query: string, chunk: DocumentChunk): number {
  const queryLower = query.toLowerCase();      // 转为小写，忽略大小写
  const contentLower = chunk.content.toLowerCase();
  
  let score = 0;  // 初始得分
  
  // 规则 1：完整查询匹配（最高优先级）
  if (contentLower.includes(queryLower)) {
    score += 10;  // 如果完整查询出现在文档中，+10 分
  }
  
  // 规则 2：词匹配
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 1);
  // split(/\s+/)：按空格分割
  // filter((w) => w.length > 1)：过滤掉单字符词（如"的"、"了"）
  
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      score += 1;  // 每个匹配的词 +1 分
    }
  }
  
  // 规则 3：标题匹配
  const lines = chunk.content.split("\n");
  for (const line of lines) {
    if (line.startsWith("#") && line.toLowerCase().includes(queryLower)) {
      score += 5;  // 标题匹配 +5 分（标题通常很重要）
    }
  }
  
  // 规则 4：标签匹配
  if (chunk.metadata?.tags) {
    const tags = chunk.metadata.tags as string[];
    for (const tag of tags) {
      if (queryLower.includes(tag.toLowerCase())) {
        score += 2;  // 标签匹配 +2 分
      }
    }
  }
  
  return score;
}
```

**实际计算示例**：

```
查询："如何安装 LangChain.js？"
文档片段：chunk-02（安装文档）

计算过程：
1. 完整查询匹配：
   - queryLower = "如何安装 langchain.js？"
   - contentLower = "# 安装 langchain.js\n使用 npm 安装..."
   - contentLower.includes(queryLower) = false（问句 vs 陈述句）
   → score = 0

2. 词匹配：
   - queryWords = ["如何", "安装", "langchain.js"]
   - "如何" 未出现 → 0 分
   - "安装" 出现 → +1 分
   - "langchain.js" 出现 → +1 分
   → score = 0 + 1 + 1 = 2

3. 标题匹配：
   - 标题行："# 安装 LangChain.js"
   - 包含 "安装" 和 "langchain.js" → +5 分
   → score = 2 + 5 = 7

4. 标签匹配：
   - 假设 tags = ["安装", "环境配置"]
   - "安装" 在查询中 → +2 分
   → score = 7 + 2 = 9

最终得分：9 分
```

---

### 3. answer.ts - 问答链路组合

#### 文件作用

将检索器、Prompt、LLM、解析器组合成完整的问答链路。

#### 核心函数解析

**函数 1：`buildQAChain`**

```typescript
export function buildQAChain(
  retriever: (q: string) => Promise<string> = simpleRetriever,
  // ↑ 检索器函数，默认使用 simpleRetriever
  // 可以传入自定义检索器
  
  modelConfig?: {
    temperature?: number;   // 模型温度（0-1），默认 0
    modelName?: string;     // 模型名称，默认 "gpt-3.5-turbo"
  }
) {
```

**初始化模型**：

```typescript
const model = new ChatOpenAI({
  temperature: modelConfig?.temperature ?? 0,
  // ?? 是空值合并运算符
  // 如果 modelConfig?.temperature 是 null 或 undefined，使用 0
  
  modelName: modelConfig?.modelName ?? "gpt-3.5-turbo",
  // 默认使用 gpt-3.5-turbo（成本更低）
  // 可以改为 "gpt-4"（更准确但更贵）
});
```

**为什么 temperature=0？**

- `temperature` 控制输出的随机性
- `0` = 最确定，每次相同输入得到相同输出
- `1` = 最随机，每次输出可能不同
- 对于需要稳定 JSON 输出的场景，使用 `0` 最合适

**初始化解析器**：

```typescript
const parser = new JsonOutputParser<QAResult>();
// JsonOutputParser 会自动解析 LLM 输出的 JSON 字符串
// <QAResult> 是 TypeScript 泛型，指定解析后的类型
```

**构建链路**：

```typescript
const chain = RunnableSequence.from([
  // 步骤 1：检索文档
  async (input: QAInput) => {
    // 这是一个异步函数，接收用户问题
    console.log(`\n[检索阶段] 查询: ${input.question}`);
    
    const chunks = await retriever(input.question);
    // 调用检索器，获取相关文档片段
    
    console.log(`[检索阶段] 检索到 ${chunks.length > 0 ? "相关" : "无"} 片段`);
    // 调试信息：显示是否找到相关片段
    
    return {
      question: input.question,  // 保留原始问题
      chunks,                     // 添加检索到的片段
    };
    // 返回的对象会作为下一步的输入
  },
  
  // 步骤 2：填充 Prompt
  answerPrompt,
  // answerPrompt 是 ChatPromptTemplate
  // 它会自动使用上一步返回的 { question, chunks } 填充模板
  
  // 步骤 3：调用 LLM
  model,
  // ChatOpenAI 模型
  // 接收填充后的 Prompt，返回 LLM 的响应
  
  // 步骤 4：解析 JSON
  parser,
  // JsonOutputParser
  // 将 LLM 的文本输出解析为 JSON 对象
]);

return chain;
// 返回完整的链路，可以调用 chain.invoke({ question: "..." })
```

**使用示例**：

```typescript
// 创建链路
const chain = buildQAChain();

// 调用链路
const result = await chain.invoke({
  question: "如何安装 LangChain.js？"
});

// result 的类型是 QAResult：
// {
//   answer: string,
//   citations: Array<{ source: string, chunkId: string }>,
//   confidence: number
// }
```

**函数 2：`askQuestion`（便捷函数）**

```typescript
export async function askQuestion(
  question: string,
  options?: {
    retriever?: (q: string) => Promise<string>;
    temperature?: number;
    modelName?: string;
    topK?: number;  // 检索前 K 个片段
  }
): Promise<QAResult> {
  // 如果提供了 topK，创建一个包装的检索器
  const retriever = options?.retriever
    ? options.retriever
    : async (q: string) => simpleRetriever(q, options?.topK);
    // 如果没有提供自定义检索器，使用 simpleRetriever
    // 并传入 topK 参数
  
  const chain = buildQAChain(retriever, {
    temperature: options?.temperature,
    modelName: options?.modelName,
  });
  
  const result = await chain.invoke({ question });
  return result;
}
```

**使用示例**：

```typescript
// 简单使用
const result = await askQuestion("如何安装 LangChain.js？");

// 自定义配置
const result = await askQuestion("如何安装 LangChain.js？", {
  topK: 5,           // 检索前 5 个片段
  temperature: 0,    // 低温度
  modelName: "gpt-4" // 使用 GPT-4
});
```

---

### 4. server.ts - CLI 入口

#### 文件作用

提供命令行接口，方便测试和调试。

#### 核心函数解析

**函数 1：`testSingleQuestion`**

```typescript
async function testSingleQuestion(question: string) {
  console.log(`\n📝 用户问题: ${question}`);
  // 显示当前测试的问题
  
  try {
    const result = await askQuestion(question, {
      topK: 3,           // 检索前 3 个片段
      temperature: 0,    // 低温度，保证稳定性
    });
    
    console.log(formatQAResult(result));
    // formatQAResult 将结果格式化为易读的字符串
  } catch (error) {
    // 错误处理
    if (error instanceof Error) {
      console.error(`❌ 错误: ${error.message}`);
    } else {
      console.error(`❌ 未知错误:`, error);
    }
  }
}
```

**函数 2：`testMultipleQuestions`**

```typescript
async function testMultipleQuestions(questions: string[]) {
  console.log(`\n🔬 批量测试模式 - 共 ${questions.length} 个问题\n`);
  
  const results = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] 测试问题: ${question}`);
    
    try {
      const result = await askQuestion(question, {
        topK: 3,
        temperature: 0,
      });
      
      results.push({ question, result, success: true });
      console.log(formatQAResult(result));
    } catch (error) {
      results.push({ question, error, success: false });
    }
    
    // 添加延迟避免 API 限流
    if (i < questions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 等待 1 秒再处理下一个问题
    }
  }
  
  // 显示统计
  const successCount = results.filter((r) => r.success).length;
  const avgConfidence = results
    .filter((r) => r.success)
    .reduce((sum, r) => sum + (r.result?.confidence ?? 0), 0) / successCount;
  
  console.log(`\n📊 测试统计`);
  console.log(`总问题数: ${questions.length}`);
  console.log(`成功: ${successCount} (${((successCount / questions.length) * 100).toFixed(1)}%)`);
  console.log(`失败: ${results.length - successCount}`);
  console.log(`平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
}
```

---

## 🎓 实际使用示例

### 示例 1：基本问答

```typescript
import { askQuestion } from "./answer";

// 简单提问
const result = await askQuestion("什么是 LangChain.js？");

console.log("答案：", result.answer);
console.log("来源：", result.citations);
console.log("置信度：", result.confidence);
```

**输出**：

```
答案： LangChain.js 是一个用于构建大语言模型应用的框架...
来源： [{"source": "docs/intro.md", "chunkId": "chunk-01"}]
置信度： 0.95
```

### 示例 2：自定义配置

```typescript
import { askQuestion } from "./answer";

// 使用更多文档片段，提高答案质量
const result = await askQuestion("如何实现 RAG？", {
  topK: 5,              // 检索前 5 个片段（默认 3）
  temperature: 0.3,     // 稍微提高创造性（默认 0）
  modelName: "gpt-4",   // 使用 GPT-4（默认 gpt-3.5-turbo）
});
```

### 示例 3：批量处理

```typescript
import { askQuestions } from "./answer";

const questions = [
  "什么是 LangChain.js？",
  "如何安装？",
  "如何使用 Prompt 模板？",
];

const results = await askQuestions(questions);

results.forEach((result, index) => {
  console.log(`问题 ${index + 1}: ${questions[index]}`);
  console.log(`答案: ${result.answer}`);
  console.log(`置信度: ${result.confidence}`);
  console.log("---");
});
```

### 示例 4：自定义检索器

```typescript
import { buildQAChain } from "./answer";

// 创建自定义检索器
const customRetriever = async (query: string) => {
  // 可以在这里接入真实的向量数据库
  // 例如：Chroma、Pinecone、Weaviate 等
  
  // 示例：简单的关键词过滤
  const relevantDocs = knowledgeBase.filter(doc => 
    doc.content.toLowerCase().includes(query.toLowerCase())
  );
  
  return relevantDocs
    .slice(0, 3)
    .map(doc => `## ${doc.title}\n${doc.content}`)
    .join("\n\n---\n\n");
};

// 使用自定义检索器构建链路
const chain = buildQAChain(customRetriever, {
  temperature: 0,
  modelName: "gpt-3.5-turbo",
});

// 使用链路
const result = await chain.invoke({
  question: "如何安装 LangChain.js？"
});
```

---

## 🔬 技术原理深入

### 1. 为什么需要 JSON 输出？

**问题**：LLM 默认输出是纯文本，程序难以处理。

**解决方案**：要求 LLM 输出 JSON 格式。

**优势**：
- ✅ 结构化：程序可以直接解析
- ✅ 类型安全：TypeScript 可以验证类型
- ✅ 可扩展：可以添加更多字段（如时间戳、版本等）

**实现**：

```typescript
// 1. 在 Prompt 中明确要求 JSON
"请严格输出以下 JSON 格式：{...}"

// 2. 使用 JsonOutputParser 解析
const parser = new JsonOutputParser<QAResult>();
const result = await parser.parse(llmOutput);

// 3. TypeScript 类型定义
interface QAResult {
  answer: string;
  citations: Array<{ source: string; chunkId: string }>;
  confidence: number;
}
```

### 2. 为什么需要置信度？

**问题**：如何判断答案是否可靠？

**解决方案**：让 LLM 自己评估答案的可信度。

**用途**：
- 前端可以根据置信度决定是否显示答案
- 低置信度答案可以标记为"不确定"
- 可以排序：优先显示高置信度答案

**评分标准**（在 Prompt 中定义）：

```
0.9-1.0: 片段中有明确、完整的答案
0.7-0.9: 片段中有相关信息，但需要轻微推理
0.5-0.7: 片段中有部分相关信息
0.3-0.5: 片段关联性较弱
0.0-0.3: 无相关信息或不确定
```

### 3. 为什么需要引用（Citations）？

**问题**：用户想知道答案来自哪里。

**解决方案**：要求 LLM 在答案中引用来源。

**优势**：
- ✅ 可追溯：可以查看原始文档
- ✅ 可信度：有来源的答案更可信
- ✅ 可验证：用户可以自己验证答案

**实现**：

```typescript
// Prompt 中要求
"必须引用来源片段"

// 输出格式
{
  "citations": [
    {"source": "docs/intro.md", "chunkId": "chunk-01"}
  ]
}
```

### 4. 防幻觉机制

**问题**：LLM 可能编造看似合理但错误的信息。

**解决方案**：在 Prompt 中明确要求"不知道就说不知道"。

**实现**：

```typescript
// Prompt 中的关键约束
"如果检索到的片段中没有包含答案相关信息，请明确说'我不知道'"
"不要编造或推测任何信息"
```

**效果**：

```
用户问："LangChain.js 支持 Python 吗？"
知识库中没有相关信息

传统 LLM：可能回答"支持"（错误！）
本系统：回答"我不知道"（正确！）
```

---

## ❓ 常见问题详解

### Q1: JSON 解析失败怎么办？

**症状**：
```
Error: Failed to parse JSON from LLM output
```

**原因**：
1. LLM 输出了额外文字（如"好的，这是 JSON：{...}"）
2. JSON 格式不合法（缺少引号、逗号等）
3. LLM 没有严格按照要求输出

**解决方案**：

**方案 1：强化 Prompt**

```typescript
// 在 Prompt 中更明确地要求
"请只输出 JSON，不要添加任何额外的文字、解释或标记。
直接输出 JSON 对象，不要用代码块包裹。"
```

**方案 2：降低温度**

```typescript
const model = new ChatOpenAI({
  temperature: 0,  // 使用最低温度，保证输出稳定
});
```

**方案 3：提供 JSON 示例**

```typescript
// 在 Prompt 中提供完整的示例
"输出格式示例：
{
  \"answer\": \"这是答案\",
  \"citations\": [{\"source\": \"file.md\", \"chunkId\": \"chunk-01\"}],
  \"confidence\": 0.9
}"
```

**方案 4：使用更强大的模型**

```typescript
const model = new ChatOpenAI({
  modelName: "gpt-4",  // GPT-4 更擅长遵循格式要求
});
```

### Q2: 检索不到相关文档怎么办？

**症状**：
- 检索结果为空
- 返回的文档片段不相关
- 答案质量差

**原因**：
1. 知识库中没有相关内容
2. 关键词匹配不准确
3. 文档分割不合理

**解决方案**：

**方案 1：增加检索数量**

```typescript
const result = await askQuestion(question, {
  topK: 5,  // 从 3 增加到 5，获取更多候选文档
});
```

**方案 2：优化文档分割**

```typescript
// 在 ingest.ts 中调整分割策略
const chunks = splitText(content, {
  chunkSize: 500,    // 减小块大小，提高精确度
  chunkOverlap: 100, // 增加重叠，保持上下文
});
```

**方案 3：使用真实向量数据库**

```typescript
// 替换简单的关键词匹配为向量检索
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";

const vectorStore = await Chroma.fromDocuments(
  documents,
  new OpenAIEmbeddings()
);

const retriever = vectorStore.asRetriever({ k: 3 });
```

**方案 4：改进相似度计算**

```typescript
// 在 retriever.ts 中优化 calculateSimilarity 函数
// 例如：使用 TF-IDF、BM25 等更先进的算法
```

### Q3: 置信度总是很高/很低怎么办？

**症状**：
- 所有答案的置信度都是 0.9+
- 或者都是 0.3 以下
- 置信度与实际准确性不匹配

**原因**：
1. Prompt 中的评分标准不够清晰
2. LLM 对置信度的理解有偏差
3. 缺少 Few-shot 示例

**解决方案**：

**方案 1：提供详细的评分标准**

```typescript
// 在 Prompt 中更详细地说明
"置信度评分标准（必须严格遵守）：
- 0.9-1.0: 片段中有明确、完整、直接的答案，无需任何推理
- 0.7-0.9: 片段中有相关信息，需要轻微推理或组合
- 0.5-0.7: 片段中有部分相关信息，需要较多推理
- 0.3-0.5: 片段关联性较弱，答案不确定
- 0.0-0.3: 无相关信息，应该回答'我不知道'"
```

**方案 2：添加 Few-shot 示例**

```typescript
// 在 Prompt 中添加示例
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "..."],
  ["human", "问题：什么是 LangChain.js？\n片段：LangChain.js 是一个框架..."],
  ["ai", JSON.stringify({
    answer: "LangChain.js 是一个用于构建 LLM 应用的框架",
    citations: [{"source": "intro.md", "chunkId": "chunk-01"}],
    confidence: 0.95  // 明确、完整的答案
  })],
  ["human", "{question}\n片段：{chunks}"],
]);
```

**方案 3：后处理校准**

```typescript
// 根据实际测试结果调整置信度
function calibrateConfidence(rawConfidence: number, actualAccuracy: number): number {
  // 如果实际准确率低于置信度，降低置信度
  // 如果实际准确率高于置信度，提高置信度
  return rawConfidence * (actualAccuracy / rawConfidence);
}
```

### Q4: 响应速度慢怎么办？

**症状**：
- 每个问题需要 3-5 秒
- 批量测试很慢

**原因**：
1. LLM API 调用延迟
2. 检索过程慢
3. 没有并发处理

**解决方案**：

**方案 1：使用更快的模型**

```typescript
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",  // 比 gpt-4 快很多
});
```

**方案 2：实现缓存**

```typescript
const cache = new Map<string, QAResult>();

async function askQuestionWithCache(question: string) {
  // 检查缓存
  if (cache.has(question)) {
    return cache.get(question)!;
  }
  
  // 调用 API
  const result = await askQuestion(question);
  
  // 存入缓存
  cache.set(question, result);
  return result;
}
```

**方案 3：并发处理**

```typescript
// 批量处理时使用并发
const results = await Promise.all(
  questions.map(q => askQuestion(q))
);
```

**方案 4：流式输出**

```typescript
// 使用流式输出，用户可以立即看到部分结果
const chain = buildStreamingQAChain();
const stream = await chain.stream({ question });

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Q5: API 成本太高怎么办？

**症状**：
- 每次调用花费 $0.01-0.05
- 批量测试花费 $1+

**原因**：
1. 使用 GPT-4（比 GPT-3.5 贵 20 倍）
2. 没有缓存
3. 检索的文档片段太长

**解决方案**：

**方案 1：使用更便宜的模型**

```typescript
const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",  // 成本约为 GPT-4 的 1/20
});
```

**方案 2：限制 Token 数量**

```typescript
const model = new ChatOpenAI({
  maxTokens: 500,  // 限制最大输出长度
});
```

**方案 3：优化文档片段长度**

```typescript
// 在检索时只返回关键部分
const retriever = async (query: string) => {
  const chunks = await simpleRetriever(query, 3);
  // 只返回每个片段的前 500 个字符
  return chunks.split('\n').slice(0, 20).join('\n');
};
```

**方案 4：实现缓存**

```typescript
// 常见问题的答案可以缓存，避免重复调用 API
```

---

## 🚀 进阶扩展

### 1. 接入真实向量数据库

**当前实现**：简单的内存检索（关键词匹配）

**生产环境**：使用向量数据库（语义检索）

**实现步骤**：

#### 步骤 1：安装依赖

```bash
npm install chromadb
# 或
npm install @pinecone-database/pinecone
```

#### 步骤 2：创建向量存储

```typescript
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// 1. 加载文档
const loader = new TextLoader("docs/faq.txt");
const docs = await loader.load();

// 2. 分割文档
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const chunks = await splitter.splitDocuments(docs);

// 3. 创建向量存储
const vectorStore = await Chroma.fromDocuments(
  chunks,
  new OpenAIEmbeddings({
    modelName: "text-embedding-ada-002",  // OpenAI 的嵌入模型
  }),
  {
    collectionName: "faq_collection",
  }
);

// 4. 创建检索器
const retriever = vectorStore.asRetriever({
  k: 3,  // 返回前 3 个最相关的文档
});
```

#### 步骤 3：替换简单检索器

```typescript
// 在 answer.ts 中使用
const chain = buildQAChain(
  async (query: string) => {
    const docs = await retriever.getRelevantDocuments(query);
    return docs.map(d => d.pageContent).join("\n\n---\n\n");
  }
);
```

**优势**：
- ✅ 语义理解：能理解同义词和相似概念
- ✅ 准确性高：基于向量相似度，比关键词匹配准确
- ✅ 可扩展：支持大规模文档库

### 2. 添加重排序（Re-ranking）

**问题**：向量检索可能返回不相关的结果。

**解决方案**：使用更精确的模型重新排序。

**实现**：

```typescript
import { CohereRerank } from "@langchain/cohere";

// 1. 初始检索（返回更多候选）
const initialDocs = await retriever.getRelevantDocuments(query, { k: 10 });

// 2. 重排序
const reranker = new CohereRerank({
  model: "rerank-english-v2.0",
  apiKey: process.env.COHERE_API_KEY,
});

const rerankedDocs = await reranker.rerank(query, initialDocs, { topN: 3 });

// 3. 使用重排序后的结果
const topDocs = rerankedDocs.map(d => d.document.pageContent);
```

**优势**：
- ✅ 提高准确性：二次筛选，去除不相关结果
- ✅ 灵活：可以调整 topN 参数

### 3. 实现多轮对话

**当前实现**：每次问答都是独立的

**扩展**：支持上下文记忆

**实现**：

```typescript
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory();

const chain = RunnableSequence.from([
  // 1. 获取对话历史
  async (input) => {
    const history = await memory.loadMemoryVariables({});
    return {
      ...input,
      chat_history: history.chat_history || [],
    };
  },
  
  // 2. 检索文档
  async (input) => ({
    ...input,
    chunks: await retriever(input.question),
  }),
  
  // 3. 填充 Prompt（包含历史）
  ChatPromptTemplate.fromMessages([
    ["system", "..."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}\n片段：{chunks}"],
  ]),
  
  model,
  parser,
  
  // 4. 保存到记忆
  async (output) => {
    await memory.saveContext(
      { input: output.question },
      { output: output.answer }
    );
    return output;
  },
]);
```

### 4. Web API 集成

**实现 REST API**：

```typescript
import express from "express";
import { askQuestion } from "./answer";

const app = express();
app.use(express.json());

// POST /api/ask
app.post("/api/ask", async (req, res) => {
  try {
    const { question, options } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }
    
    const result = await askQuestion(question, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

**使用示例**：

```bash
# 提问
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "如何安装 LangChain.js？"}'
```

### 5. 添加监控和日志

**实现**：

```typescript
import { LangChainTracer } from "langchain/callbacks";

// 1. 启用 LangSmith 追踪
const tracer = new LangChainTracer({
  projectName: "faq-rag-chat",
});

// 2. 在链路中使用
const chain = buildQAChain().withConfig({
  callbacks: [tracer],
});

// 3. 自定义日志
const logger = {
  log: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
  },
};

// 在关键步骤添加日志
logger.log("Question received", { question });
logger.log("Retrieval completed", { chunkCount });
logger.log("Answer generated", { confidence });
```

---

## 📊 性能优化建议

### 1. 检索优化

- ✅ 使用向量数据库替代关键词匹配
- ✅ 实现结果缓存
- ✅ 优化文档分割策略
- ✅ 使用重排序提高准确性

### 2. LLM 调用优化

- ✅ 使用 GPT-3.5-turbo（成本低、速度快）
- ✅ 限制 max_tokens
- ✅ 实现请求缓存
- ✅ 批量处理时使用并发

### 3. 系统架构优化

- ✅ 实现流式输出
- ✅ 添加请求队列
- ✅ 使用 CDN 缓存静态资源
- ✅ 实现负载均衡

---

## 📚 学习路径

### 初学者

1. ✅ 理解 RAG 的基本概念
2. ✅ 运行示例代码
3. ✅ 修改 Prompt 看效果
4. ✅ 添加自己的文档

### 进阶

1. ✅ 理解 Prompt 工程原理
2. ✅ 优化检索策略
3. ✅ 接入向量数据库
4. ✅ 实现多轮对话

### 高级

1. ✅ 实现重排序
2. ✅ 优化系统性能
3. ✅ 添加监控和日志
4. ✅ 部署到生产环境

---

## 🎉 总结

这个项目展示了如何：

1. **使用 Prompt 工程**规范化 LLM 输出
2. **实现 RAG 系统**降低模型幻觉
3. **构建完整链路**使用 RunnableSequence
4. **结构化输出**便于前端处理
5. **提供可追溯性**通过引用列表

**核心价值**：
- ✅ **低幻觉**：基于文档回答，不编造信息
- ✅ **可追溯**：每个答案都有来源引用
- ✅ **可扩展**：易于接入真实向量数据库
- ✅ **可评测**：内置测试框架

**适用场景**：
- 📖 产品 FAQ 问答
- 📚 技术文档助手
- 🏢 企业知识库
- 🎓 教育学习辅助

---

**作者**: LangChain Tutorial Team  
**更新时间**: 2025-12-24  
**版本**: 1.0.0

---

## 📞 获取帮助

- 📖 查看代码注释了解详细实现
- 💬 遇到问题可以查看"常见问题详解"部分
- 🔗 参考 [LangChain.js 官方文档](https://js.langchain.com/)

**祝你使用愉快！** 🎊
