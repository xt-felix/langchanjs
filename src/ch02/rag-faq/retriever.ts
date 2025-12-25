/**
 * 检索器模块
 * 
 * 实际生产环境中应该使用：
 * - Chroma（本地向量数据库）
 * - Pinecone（云端向量数据库）
 * - Weaviate（开源向量搜索引擎）
 * - Qdrant（高性能向量数据库）
 * 
 * 本示例使用简单的内存检索器用于演示
 */

/**
 * 文档片段接口
 */
export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  metadata?: Record<string, unknown>;
}

/**
 * 内存中的 FAQ 知识库（模拟向量数据库）
 */
const faqKnowledgeBase: DocumentChunk[] = [
  {
    id: "chunk-01",
    content: `# LangChain.js 简介
LangChain.js 是一个用于构建大语言模型（LLM）应用的 JavaScript/TypeScript 框架。
它提供了模块化的组件，帮助开发者快速构建复杂的 LLM 驱动应用。

主要特性：
- 模块化设计，易于组合
- 支持多种 LLM 提供商（OpenAI、Anthropic 等）
- 内置 Prompt 管理和优化
- 支持链式调用和流式输出`,
    source: "docs/intro.md",
    metadata: { category: "基础概念", tags: ["简介", "特性"] },
  },
  {
    id: "chunk-02",
    content: `# 安装 LangChain.js

使用 npm 安装：
\`\`\`bash
npm install @langchain/core @langchain/openai
\`\`\`

或使用 yarn：
\`\`\`bash
yarn add @langchain/core @langchain/openai
\`\`\`

注意：需要 Node.js 版本 >= 16.0.0`,
    source: "docs/installation.md",
    metadata: { category: "入门", tags: ["安装", "环境配置"] },
  },
  {
    id: "chunk-03",
    content: `# Prompt 模板使用

LangChain.js 提供了 ChatPromptTemplate 来管理提示词：

\`\`\`typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有帮助的助手"],
  ["human", "{question}"]
]);
\`\`\`

模板支持变量替换，使用 {变量名} 语法。`,
    source: "docs/prompts.md",
    metadata: { category: "核心功能", tags: ["Prompt", "模板"] },
  },
  {
    id: "chunk-04",
    content: `# 输出解析器

LangChain.js 提供多种输出解析器：

1. **StringOutputParser**: 解析为字符串
2. **JsonOutputParser**: 解析为 JSON 对象
3. **StructuredOutputParser**: 使用 Zod 定义结构

示例：
\`\`\`typescript
import { JsonOutputParser } from "@langchain/core/output_parsers";

const parser = new JsonOutputParser();
const result = await parser.parse(response);
\`\`\``,
    source: "docs/output-parsers.md",
    metadata: { category: "核心功能", tags: ["输出解析", "JSON"] },
  },
  {
    id: "chunk-05",
    content: `# RunnableSequence 链式调用

使用 RunnableSequence 构建处理链：

\`\`\`typescript
import { RunnableSequence } from "@langchain/core/runnables";

const chain = RunnableSequence.from([
  prompt,
  model,
  parser
]);

const result = await chain.invoke(input);
\`\`\`

链式调用可以组合多个步骤，自动传递中间结果。`,
    source: "docs/runnables.md",
    metadata: { category: "高级用法", tags: ["链式调用", "Runnable"] },
  },
  {
    id: "chunk-06",
    content: `# 错误处理和调试

常见问题：

1. **API Key 未设置**：设置环境变量 OPENAI_API_KEY
2. **超时错误**：增加 timeout 配置
3. **Rate Limit**：添加重试机制或降低请求频率

调试技巧：
- 使用 callbacks 查看中间结果
- 启用 verbose 模式
- 检查 LangSmith 追踪日志`,
    source: "docs/troubleshooting.md",
    metadata: { category: "常见问题", tags: ["错误处理", "调试"] },
  },
  {
    id: "chunk-07",
    content: `# RAG（检索增强生成）

RAG 是结合检索和生成的技术：

1. **文档加载**：使用 Document Loaders
2. **文本分割**：使用 Text Splitters
3. **向量化**：使用 Embeddings
4. **向量存储**：使用 Vector Stores（如 Chroma、Pinecone）
5. **检索**：查找相似文档
6. **生成**：基于检索结果生成答案

RAG 可以显著降低模型幻觉，提供可追溯的答案来源。`,
    source: "docs/rag.md",
    metadata: { category: "高级用法", tags: ["RAG", "向量检索"] },
  },
  {
    id: "chunk-08",
    content: `# 价格与限制

OpenAI API 定价（参考）：
- GPT-4: $0.03/1K tokens (输入), $0.06/1K tokens (输出)
- GPT-3.5-turbo: $0.0005/1K tokens (输入), $0.0015/1K tokens (输出)

使用建议：
- 开发测试使用 GPT-3.5-turbo
- 生产环境根据需求选择模型
- 合理设置 max_tokens 限制
- 使用缓存减少重复请求`,
    source: "docs/pricing.md",
    metadata: { category: "参考", tags: ["价格", "限制"] },
  },
];

/**
 * 简单的相似度计算（基于关键词匹配）
 * 实际应用中应该使用向量嵌入和余弦相似度
 */
function calculateSimilarity(query: string, chunk: DocumentChunk): number {
  const queryLower = query.toLowerCase();
  const contentLower = chunk.content.toLowerCase();

  // 简单的关键词匹配评分
  let score = 0;

  // 检查完整查询是否出现在内容中
  if (contentLower.includes(queryLower)) {
    score += 10;
  }

  // 检查查询中的每个词
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 1);
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      score += 1;
    }
  }

  // 检查标题匹配（# 开头的行）
  const lines = chunk.content.split("\n");
  for (const line of lines) {
    if (line.startsWith("#") && line.toLowerCase().includes(queryLower)) {
      score += 5;
    }
  }

  // 检查元数据标签匹配
  if (chunk.metadata?.tags) {
    const tags = chunk.metadata.tags as string[];
    for (const tag of tags) {
      if (queryLower.includes(tag.toLowerCase())) {
        score += 2;
      }
    }
  }

  return score;
}

/**
 * 简单检索器实现
 * 
 * @param query - 用户查询
 * @param topK - 返回前 K 个最相关的文档片段（默认 3）
 * @returns 格式化的检索结果字符串
 */
export async function simpleRetriever(
  query: string,
  topK: number = 3
): Promise<string> {
  // 计算每个文档片段与查询的相似度
  const scoredChunks = faqKnowledgeBase.map((chunk) => ({
    chunk,
    score: calculateSimilarity(query, chunk),
  }));

  // 按相似度排序并取前 K 个
  const topChunks = scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((item) => item.score > 0); // 过滤掉完全不相关的

  // 如果没有相关文档
  if (topChunks.length === 0) {
    return "未找到相关文档片段。";
  }

  // 格式化输出
  const formattedChunks = topChunks
    .map((item, index) => {
      const { chunk } = item;
      return `
## 片段 ${index + 1}: ${chunk.id}
**来源**: ${chunk.source}
**相关度**: ${item.score}

${chunk.content}
---`;
    })
    .join("\n");

  return formattedChunks;
}

/**
 * 高级检索器（返回结构化数据）
 * 
 * @param query - 用户查询
 * @param topK - 返回前 K 个最相关的文档片段（默认 3）
 * @returns 结构化的文档片段数组
 */
export async function advancedRetriever(
  query: string,
  topK: number = 3
): Promise<Array<DocumentChunk & { score: number }>> {
  const scoredChunks = faqKnowledgeBase.map((chunk) => ({
    ...chunk,
    score: calculateSimilarity(query, chunk),
  }));

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((item) => item.score > 0);
}

/**
 * 添加文档到知识库（模拟向量化）
 * 
 * @param chunk - 要添加的文档片段
 */
export function addDocumentToKnowledgeBase(chunk: DocumentChunk): void {
  faqKnowledgeBase.push(chunk);
}

/**
 * 获取知识库统计信息
 */
export function getKnowledgeBaseStats() {
  return {
    totalChunks: faqKnowledgeBase.length,
    sources: [...new Set(faqKnowledgeBase.map((c) => c.source))],
    categories: [
      ...new Set(
        faqKnowledgeBase
          .map((c) => c.metadata?.category as string)
          .filter(Boolean)
      ),
    ],
  };
}

