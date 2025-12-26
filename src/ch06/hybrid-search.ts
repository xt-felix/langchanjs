/**
 * 混合搜索示例 - 结合关键词搜索（BM25）和向量搜索
 */

import { SimpleVectorStore } from "./simple-vector-store";
import { createDocsFromTexts } from "./loaders";
import { makeChunks } from "./chunk";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 简单的关键词搜索（BM25 简化版）
 */
class KeywordSearch {
  private documents: Array<{ id: string; text: string; meta?: any }> = [];

  /**
   * 添加文档
   */
  addDocuments(docs: Array<{ id: string; text: string; meta?: any }>): void {
    this.documents = docs;
  }

  /**
   * 关键词搜索
   * @param query - 查询文本
   * @param k - 返回前 K 个
   * @returns 搜索结果
   */
  search(
    query: string,
    k: number = 5
  ): Array<{ text: string; score: number; meta?: any }> {
    const queryTerms = query.toLowerCase().split(/\s+/);

    // 计算每个文档的匹配分数
    const results = this.documents.map((doc) => {
      const text = doc.text.toLowerCase();
      let score = 0;

      // 简单的 TF 计分
      for (const term of queryTerms) {
        const matches = text.match(new RegExp(term, "g"));
        if (matches) {
          score += matches.length;
        }
      }

      return {
        text: doc.text,
        score,
        meta: doc.meta,
      };
    });

    // 过滤掉分数为 0 的结果，并排序
    return results
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

/**
 * 混合搜索引擎
 */
export class HybridSearchEngine {
  private vectorStore: SimpleVectorStore;
  private keywordSearch: KeywordSearch;

  constructor() {
    this.vectorStore = new SimpleVectorStore();
    this.keywordSearch = new KeywordSearch();
  }

  /**
   * 添加文档
   */
  async addDocuments(
    chunks: Array<{ id: string; text: string; meta?: any }>
  ): Promise<void> {
    await this.vectorStore.addDocuments(chunks);
    this.keywordSearch.addDocuments(chunks);
  }

  /**
   * 混合搜索
   * @param query - 查询文本
   * @param k - 返回前 K 个
   * @param vectorWeight - 向量搜索权重（0-1）
   * @returns 搜索结果
   */
  async hybridSearch(
    query: string,
    k: number = 5,
    vectorWeight: number = 0.7
  ): Promise<Array<{ text: string; score: number; source: string; meta?: any }>> {
    // 1. 向量搜索
    const vectorResults = await this.vectorStore.similaritySearch(query, k * 2);

    // 2. 关键词搜索
    const keywordResults = this.keywordSearch.search(query, k * 2);

    // 3. 归一化分数
    const normalizeScores = (
      results: Array<{ score: number }>
    ): Array<number> => {
      const scores = results.map((r) => r.score);
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const range = max - min;

      if (range === 0) return scores.map(() => 1);

      return scores.map((s) => (s - min) / range);
    };

    const normalizedVectorScores = normalizeScores(vectorResults);
    const normalizedKeywordScores = normalizeScores(keywordResults);

    // 4. 合并结果
    const combinedResults = new Map<
      string,
      { text: string; score: number; sources: string[]; meta?: any }
    >();

    // 添加向量搜索结果
    vectorResults.forEach((result, idx) => {
      const key = result.text.slice(0, 100); // 使用文本前100字符作为key
      combinedResults.set(key, {
        text: result.text,
        score: normalizedVectorScores[idx] * vectorWeight,
        sources: ["vector"],
        meta: result.meta,
      });
    });

    // 添加关键词搜索结果
    keywordResults.forEach((result, idx) => {
      const key = result.text.slice(0, 100);
      const existing = combinedResults.get(key);

      if (existing) {
        // 如果已存在，融合分数
        existing.score += normalizedKeywordScores[idx] * (1 - vectorWeight);
        existing.sources.push("keyword");
      } else {
        combinedResults.set(key, {
          text: result.text,
          score: normalizedKeywordScores[idx] * (1 - vectorWeight),
          sources: ["keyword"],
          meta: result.meta,
        });
      }
    });

    // 5. 排序并返回
    const finalResults = Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((r) => ({
        text: r.text,
        score: r.score,
        source: r.sources.join("+"),
        meta: r.meta,
      }));

    return finalResults;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              混合搜索示例 - 向量 + 关键词                       ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 准备文档
  const sampleTexts = [
    `LangChain 框架核心概念

LangChain 是一个强大的 AI 应用开发框架，提供了完整的工具链。核心组件包括：
- Prompts：提示词模板管理
- Models：大语言模型集成
- Chains：链式调用编排
- Memory：对话记忆系统
- Agents：智能代理
- Retrievers：文档检索器`,

    `向量数据库选型指南

常见的向量数据库：
1. Chroma - 轻量级，适合开发测试
2. Pinecone - 托管服务，易于部署
3. Weaviate - 开源，功能丰富
4. Qdrant - 高性能，支持过滤

选择建议：
- 小型项目：使用 Chroma 或内存存储
- 中型项目：使用 Pinecone 托管服务
- 大型项目：使用 Weaviate 或 Qdrant 自建`,

    `React 18 新特性详解

React 18 带来了许多重要更新：
1. 并发渲染（Concurrent Rendering）
2. 自动批处理（Automatic Batching）
3. Transitions API
4. Suspense 改进

这些特性可以显著提升应用性能和用户体验。`,

    `TypeScript 类型体操实战

TypeScript 的高级类型技巧：
- 泛型约束（Generic Constraints）
- 条件类型（Conditional Types）
- 映射类型（Mapped Types）
- 模板字面量类型（Template Literal Types）

通过这些技巧可以构建更安全、更灵活的类型系统。`,
  ];

  const docs = createDocsFromTexts(sampleTexts);
  const chunks = makeChunks(docs, 500, 50);

  console.log(`📚 准备了 ${chunks.length} 个文档块\n`);

  // 2. 初始化混合搜索引擎
  console.log("🔧 初始化混合搜索引擎...\n");

  const hybridEngine = new HybridSearchEngine();
  await hybridEngine.addDocuments(chunks);

  console.log("✅ 初始化完成\n");

  // 3. 测试不同的查询
  const testQueries = [
    {
      query: "LangChain 有哪些核心组件？",
      desc: "语义查询（向量搜索优势）",
    },
    {
      query: "Chroma Pinecone",
      desc: "关键词查询（关键词搜索优势）",
    },
    {
      query: "如何选择向量数据库？",
      desc: "混合查询（结合两者优势）",
    },
  ];

  for (const { query, desc } of testQueries) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\n🔍 查询: "${query}"`);
    console.log(`💡 场景: ${desc}\n`);

    const results = await hybridEngine.hybridSearch(query, 3, 0.6);

    console.log("📊 搜索结果:\n");

    results.forEach((result, idx) => {
      const scoreBar = "█".repeat(Math.round(result.score * 30));
      console.log(`${idx + 1}. 综合分数: ${result.score.toFixed(4)} ${scoreBar}`);
      console.log(`   来源: ${result.source}`);
      console.log(`   内容: ${result.text.slice(0, 120).replace(/\n/g, " ")}...`);
      console.log();
    });
  }

  // 4. 对比不同权重
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n⚖️  权重对比测试\n");
  console.log('查询: "向量数据库性能"\n');

  const weights = [
    { weight: 0.9, desc: "偏重向量搜索" },
    { weight: 0.5, desc: "平衡" },
    { weight: 0.1, desc: "偏重关键词搜索" },
  ];

  for (const { weight, desc } of weights) {
    console.log(`\n${desc} (向量权重=${weight}):`);

    const results = await hybridEngine.hybridSearch(
      "向量数据库性能",
      2,
      weight
    );

    results.forEach((result, idx) => {
      console.log(`  ${idx + 1}. [${result.source}] ${result.text.slice(0, 60).replace(/\n/g, " ")}...`);
    });
  }

  console.log("\n\n✅ 混合搜索示例完成！");
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
