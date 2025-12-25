---
category: 高级用法
tags: RAG, 检索增强生成, 向量数据库
---

# RAG（检索增强生成）完全指南

## 什么是 RAG？

RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合了检索和生成的 AI 技术。它通过先检索相关文档，再基于检索结果生成答案，能够显著提高答案的准确性和可信度。

### 核心优势

1. **降低幻觉**：基于真实文档回答，而非模型记忆
2. **知识可更新**：无需重新训练模型，更新文档即可
3. **可追溯性**：可以引用具体的来源文档
4. **成本效益**：无需微调大模型，维护成本低

## RAG 的完整流程

### 1. 文档加载（Document Loading）

使用 Document Loaders 加载各种格式的文档：

```typescript
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

// 加载文本文件
const txtLoader = new TextLoader("docs/faq.txt");
const txtDocs = await txtLoader.load();

// 加载 PDF 文件
const pdfLoader = new PDFLoader("docs/manual.pdf");
const pdfDocs = await pdfLoader.load();
```

### 2. 文本分割（Text Splitting）

将长文档切分成小块，便于检索：

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // 每块大小
  chunkOverlap: 200, // 重叠部分，保持上下文连续性
});

const chunks = await splitter.splitDocuments(docs);
```

### 3. 向量化（Embeddings）

将文本转换为向量表示：

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
});

const vectors = await embeddings.embedDocuments(chunks);
```

### 4. 向量存储（Vector Store）

将向量存储到数据库中：

```typescript
import { Chroma } from "@langchain/community/vectorstores/chroma";

// 使用 Chroma（本地向量数据库）
const vectorStore = await Chroma.fromDocuments(
  chunks,
  embeddings,
  {
    collectionName: "faq_collection",
  }
);
```

### 5. 检索（Retrieval）

根据查询检索相关文档：

```typescript
const retriever = vectorStore.asRetriever({
  k: 3, // 返回前 3 个最相关的文档
});

const relevantDocs = await retriever.getRelevantDocuments(
  "如何安装 LangChain？"
);
```

### 6. 生成（Generation）

基于检索结果生成答案：

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "基于以下文档片段回答问题：\n\n{context}",
  ],
  ["human", "{question}"],
]);

const model = new ChatOpenAI();

const chain = RunnableSequence.from([
  {
    context: retriever.pipe((docs) => docs.map((d) => d.pageContent).join("\n\n")),
    question: (input) => input.question,
  },
  prompt,
  model,
]);

const answer = await chain.invoke({ question: "如何安装 LangChain？" });
```

## 常用向量数据库

### 本地方案

1. **Chroma**
   - 轻量级、易部署
   - 适合开发和小规模应用

2. **FAISS**
   - Facebook 开源
   - 高性能、支持大规模向量检索

### 云端方案

1. **Pinecone**
   - 完全托管
   - 高可用、易扩展
   - 按使用量付费

2. **Weaviate**
   - 开源且支持云托管
   - GraphQL API
   - 支持多模态

3. **Qdrant**
   - 高性能
   - Rust 编写
   - 支持过滤和混合搜索

## RAG 优化技巧

### 1. 改进检索质量

#### 增加检索数量

```typescript
const retriever = vectorStore.asRetriever({
  k: 5, // 检索更多文档
});
```

#### 混合检索（Hybrid Search）

结合关键词检索和语义检索：

```typescript
// 既考虑语义相似度，也考虑关键词匹配
const retriever = vectorStore.asRetriever({
  searchType: "mmr", // Maximum Marginal Relevance
  k: 4,
});
```

### 2. 优化文档分割

#### 按语义分割

```typescript
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", "。", ".", " "], // 优先在段落、句子边界分割
});
```

### 3. 重排序（Re-ranking）

检索后使用更精确的模型重新排序：

```typescript
import { CohereRerank } from "@langchain/cohere";

const reranker = new CohereRerank({
  model: "rerank-english-v2.0",
});

const rerankedDocs = await reranker.rerank(
  query,
  relevantDocs,
  { topN: 3 }
);
```

### 4. 添加元数据过滤

```typescript
const retriever = vectorStore.asRetriever({
  filter: {
    category: "installation", // 只检索特定类别
    language: "zh-CN",
  },
});
```

## RAG vs 微调

| 对比项 | RAG | 微调 |
|--------|-----|------|
| 知识更新 | 简单，更新文档即可 | 需要重新训练 |
| 成本 | 低 | 高 |
| 可解释性 | 强，可引用来源 | 弱 |
| 准确性 | 基于文档，确定性高 | 依赖训练质量 |
| 适用场景 | 知识问答、文档助手 | 特定领域、风格定制 |

## 常见问题

### Q: RAG 能完全消除幻觉吗？

A: 不能完全消除，但能显著降低。模型仍可能对检索到的内容进行错误解读。建议：
- 在 Prompt 中强调"严格基于文档"
- 添加置信度评分
- 人工审核高风险场景

### Q: 如何处理检索不到相关文档的情况？

A: 可以设置相似度阈值：

```typescript
const docs = await retriever.getRelevantDocuments(query);
const filteredDocs = docs.filter(
  (doc) => doc.metadata.score > 0.7 // 只保留高相关度文档
);

if (filteredDocs.length === 0) {
  return "抱歉，我无法在文档中找到相关信息。";
}
```

### Q: 向量化需要多少成本？

A: 使用 OpenAI 的 text-embedding-ada-002：
- 价格：$0.0001 / 1K tokens
- 1 万个文档片段（平均 500 tokens）≈ $0.50

建议使用缓存避免重复向量化。

### Q: RAG 的响应速度如何？

A: 典型流程耗时：
- 向量检索：50-200ms
- LLM 生成：1-3 秒

可以通过流式输出改善用户体验。

