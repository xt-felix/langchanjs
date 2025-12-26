/**
 * 企业文档搜索系统 - 完整实战项目
 *
 * 功能：
 * - 多源文档加载和索引
 * - 混合搜索（向量 + 关键词）
 * - RAG 问答
 * - 元数据过滤
 * - 搜索结果高亮
 * - 错误处理和降级
 */

import { SimpleVectorStore } from "../simple-vector-store";
import { HybridSearchEngine } from "../hybrid-search";
import { RAGQuestionAnswering } from "../rag-qa";
import { createDocsFromTexts } from "../loaders";
import { makeChunks } from "../chunk";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 搜索结果类型
 */
export type SearchResult = {
  id: string;
  title: string;
  content: string;
  score: number;
  source: string;
  highlight?: string;
  meta?: Record<string, any>;
};

/**
 * 企业文档搜索引擎
 */
export class EnterpriseSearchEngine {
  private hybridSearch: HybridSearchEngine;
  private ragEngine: RAGQuestionAnswering;
  private documentIndex: Map<string, any> = new Map();

  constructor() {
    this.hybridSearch = new HybridSearchEngine();
    this.ragEngine = new RAGQuestionAnswering();
  }

  /**
   * 初始化文档库
   */
  async initialize(): Promise<void> {
    console.log("🚀 初始化企业文档搜索引擎...\n");

    // 使用示例文档
    const docs = this.getSampleDocuments();

    // 文档分块
    const chunks = makeChunks(docs, 600, 80);
    console.log(`✂️  文档分块完成: ${chunks.length} 个块\n`);

    // 索引文档
    await this.hybridSearch.addDocuments(chunks);
    await this.ragEngine.addDocuments(chunks);

    // 构建文档索引（用于快速查找）
    chunks.forEach((chunk) => {
      this.documentIndex.set(chunk.id, chunk);
    });

    console.log("✅ 搜索引擎初始化完成\n");
    console.log(`📊 统计信息:`);
    console.log(`   - 文档数: ${docs.length}`);
    console.log(`   - 块数: ${chunks.length}`);
    console.log(`   - 索引大小: ${this.documentIndex.size}\n`);
  }

  /**
   * 搜索文档
   * @param query - 查询文本
   * @param options - 搜索选项
   * @returns 搜索结果
   */
  async search(
    query: string,
    options: {
      k?: number;
      vectorWeight?: number;
      highlight?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    const { k = 5, vectorWeight = 0.6, highlight = true } = options;

    try {
      // 使用混合搜索
      const results = await this.hybridSearch.hybridSearch(
        query,
        k,
        vectorWeight
      );

      // 转换为统一格式
      return results.map((result) => {
        const chunk = this.documentIndex.get(result.meta?.id);

        return {
          id: result.meta?.id || "unknown",
          title: result.meta?.fileName || "未知文档",
          content: result.text,
          score: result.score,
          source: result.source,
          highlight: highlight ? this.highlightText(result.text, query) : undefined,
          meta: result.meta,
        };
      });
    } catch (error: any) {
      console.error("搜索失败:", error.message);

      // 降级：返回空结果
      return [];
    }
  }

  /**
   * 问答
   * @param question - 问题
   * @param k - 检索文档数
   * @returns 答案和来源
   */
  async ask(
    question: string,
    k: number = 5
  ): Promise<{
    answer: string;
    sources: Array<{ id: string; title: string }>;
    confidence: string;
  }> {
    try {
      const result = await this.ragEngine.ask(question, k);

      // 转换来源信息
      const sources = result.sources.map((source) => ({
        id: source?.id || "unknown",
        title: source?.fileName || "未知文档",
      }));

      // 简单的置信度评估
      const confidence = sources.length >= 3 ? "高" : sources.length >= 1 ? "中" : "低";

      return {
        answer: result.answer,
        sources,
        confidence,
      };
    } catch (error: any) {
      console.error("问答失败:", error.message);

      return {
        answer: "抱歉，我无法回答这个问题。请尝试重新表述或联系管理员。",
        sources: [],
        confidence: "无",
      };
    }
  }

  /**
   * 高亮文本中的关键词
   * @param text - 原文本
   * @param query - 查询词
   * @returns 高亮后的文本
   */
  private highlightText(text: string, query: string): string {
    const terms = query.toLowerCase().split(/\s+/);
    let highlighted = text;

    terms.forEach((term) => {
      const regex = new RegExp(`(${term})`, "gi");
      highlighted = highlighted.replace(regex, "【$1】");
    });

    return highlighted;
  }

  /**
   * 获取示例文档
   */
  private getSampleDocuments() {
    const texts = [
      `# LangChain.js 快速入门指南

## 什么是 LangChain.js？

LangChain.js 是 LangChain 的 JavaScript/TypeScript 实现，是一个用于构建 LLM 应用的框架。

## 核心功能

1. **Models** - 支持多种 LLM
2. **Prompts** - 提示词管理
3. **Chains** - 链式调用
4. **Memory** - 对话记忆
5. **Agents** - 智能代理
6. **Retrievers** - 文档检索

## 安装

\`\`\`bash
npm install @langchain/core @langchain/openai
\`\`\`

## 第一个例子

\`\`\`typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI();
const response = await model.invoke("Hello!");
\`\`\``,

      `# 向量数据库对比

## Chroma

**优势：**
- 轻量级，易于部署
- 支持本地运行
- 完全免费开源

**适用场景：**
- 开发测试
- 小型项目
- 原型验证

## Pinecone

**优势：**
- 托管服务，无需运维
- 高性能、高可用
- 支持大规模数据

**适用场景：**
- 生产环境
- 中大型项目
- 需要高可用性

## Weaviate

**优势：**
- 功能丰富
- 支持混合搜索
- GraphQL API

**适用场景：**
- 复杂查询需求
- 需要自建部署
- 大规模企业应用`,

      `# RAG 系统最佳实践

## 文档分块策略

### 固定长度分块
- 优点：简单直接
- 缺点：可能破坏语义

### 语义分块
- 优点：保持语义完整
- 缺点：实现复杂

### 推荐设置
- 块大小：800-1200 字符
- 重叠：100-200 字符

## 检索优化

1. **混合搜索**
   - 向量搜索 + BM25
   - 权重：0.7:0.3

2. **重排序**
   - 使用 Cross-Encoder
   - 提升 Top-K 准确率

3. **元数据过滤**
   - 时间范围
   - 文档类型
   - 作者/部门

## 提示词工程

\`\`\`
你是专业的技术助手。请基于以下上下文回答问题。

规则：
1. 只使用上下文信息
2. 如果不知道，明确说明
3. 提供具体的引用
\`\`\`

## 评估指标

- **召回率（Recall）**：检索到相关文档的比例
- **准确率（Precision）**：返回结果中相关文档的比例
- **MRR（Mean Reciprocal Rank）**：首个相关结果的平均倒数排名`,

      `# 企业级部署指南

## 架构设计

### 服务拆分
1. **文档处理服务**
   - 文档解析
   - 文本清洗
   - 分块处理

2. **索引服务**
   - 向量化
   - 存储到向量库
   - 元数据管理

3. **检索服务**
   - 查询处理
   - 混合搜索
   - 结果排序

4. **问答服务**
   - LLM 调用
   - 答案生成
   - 结果验证

## 性能优化

### 批量处理
\`\`\`typescript
// 批量向量化
const vectors = await embeddings.embedDocuments(texts);

// 批量插入
await vectorStore.addVectors(vectors, texts);
\`\`\`

### 缓存策略
- 查询缓存：相同问题复用结果
- 向量缓存：相同文本复用向量
- LLM 缓存：相同 Prompt 复用响应

### 连接池
- 数据库连接池
- HTTP 连接池
- LLM API 连接池

## 监控告警

### 关键指标
- QPS（每秒查询数）
- 延迟（P50/P95/P99）
- 错误率
- Token 消耗

### 告警规则
- 响应时间 > 2s
- 错误率 > 1%
- 向量库可用性 < 99.9%

## 成本优化

1. 使用更小的 Embedding 模型
2. 批量处理降低 API 调用
3. 缓存减少重复计算
4. 选择合适的 LLM（GPT-3.5 vs GPT-4）`,
    ];

    return createDocsFromTexts(texts, "doc");
  }
}

/**
 * 主函数 - 演示完整流程
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          企业文档搜索系统 - 完整实战项目                        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 初始化搜索引擎
  const engine = new EnterpriseSearchEngine();
  await engine.initialize();

  // 2. 测试搜索功能
  console.log("\n" + "=".repeat(64));
  console.log("🔍 功能测试 1: 文档搜索");
  console.log("=".repeat(64) + "\n");

  const searchQueries = [
    "LangChain 有哪些核心功能？",
    "如何选择向量数据库？",
    "RAG 系统如何优化？",
  ];

  for (const query of searchQueries) {
    console.log(`\n📌 查询: "${query}"\n`);

    const results = await engine.search(query, {
      k: 3,
      vectorWeight: 0.6,
      highlight: true,
    });

    console.log(`找到 ${results.length} 个相关文档:\n`);

    results.forEach((result, idx) => {
      console.log(`${idx + 1}. [${result.source}] ${result.title}`);
      console.log(`   相似度: ${result.score.toFixed(4)}`);
      console.log(`   内容: ${result.content.slice(0, 100).replace(/\n/g, " ")}...`);

      if (result.highlight) {
        const highlightSnippet = result.highlight.slice(0, 150).replace(/\n/g, " ");
        if (highlightSnippet.includes("【")) {
          console.log(`   高亮: ${highlightSnippet}...`);
        }
      }
      console.log();
    });
  }

  // 3. 测试问答功能
  console.log("\n" + "=".repeat(64));
  console.log("💬 功能测试 2: 智能问答");
  console.log("=".repeat(64) + "\n");

  const questions = [
    "LangChain.js 如何安装？",
    "Pinecone 适合什么场景？",
    "企业部署需要注意哪些性能优化？",
  ];

  for (const question of questions) {
    console.log(`\n❓ 问题: ${question}\n`);

    const result = await engine.ask(question, 4);

    console.log(`💡 答案:\n${result.answer}\n`);
    console.log(`📊 置信度: ${result.confidence}\n`);

    if (result.sources.length > 0) {
      console.log("📎 参考来源:");
      result.sources.forEach((source, idx) => {
        console.log(`   ${idx + 1}. ${source.title} (${source.id})`);
      });
    }
    console.log();
  }

  // 4. 测试错误处理
  console.log("\n" + "=".repeat(64));
  console.log("⚠️  功能测试 3: 错误处理与降级");
  console.log("=".repeat(64) + "\n");

  const edgeCases = [
    "量子计算的原理是什么？", // 知识库中没有的问题
    "",                        // 空查询
    "a",                       // 极短查询
  ];

  for (const query of edgeCases) {
    console.log(`\n测试查询: "${query || "(空)"}"\n`);

    const results = await engine.search(query || "test", { k: 2 });
    console.log(`结果数量: ${results.length}`);

    if (results.length === 0) {
      console.log("✅ 正确处理：返回空结果");
    }
    console.log();
  }

  console.log("\n✅ 企业文档搜索系统测试完成！\n");
  console.log("💡 系统特点：");
  console.log("   ✓ 混合搜索（向量 + 关键词）");
  console.log("   ✓ RAG 问答");
  console.log("   ✓ 结果高亮");
  console.log("   ✓ 错误处理");
  console.log("   ✓ 降级策略");
  console.log();
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
