/**
 * 向量搜索示例 - 使用简单向量存储
 */

import { loadMarkdownDir, createDocsFromTexts } from "./loaders";
import { makeChunks } from "./chunk";
import { SimpleVectorStore } from "./simple-vector-store";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 主函数
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                   向量搜索完整示例                              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 创建示例文档
  console.log("📚 步骤 1: 准备文档\n");

  const sampleTexts = [
    `LangChain 简介

LangChain 是一个用于开发由语言模型驱动的应用程序的框架。它提供了构建复杂 AI 应用所需的所有工具，包括提示词管理、链式调用、记忆系统、向量存储等核心功能。

LangChain.js 是 LangChain 的 JavaScript/TypeScript 版本，特别适合 Node.js 和浏览器环境。`,

    `向量化技术详解

向量化（Embedding）是将文本转换为高维向量的过程。在这个向量空间中，语义相似的文本会被映射到相近的位置。

常用的向量化模型包括：
- OpenAI text-embedding-3-small (1536维)
- OpenAI text-embedding-3-large (3072维)

向量化的应用场景：
1. 语义搜索
2. 文档检索
3. 推荐系统
4. 去重检测`,

    `React 性能优化

React 性能优化的关键点：
1. 使用 React.memo 避免不必要的重渲染
2. 使用 useMemo 和 useCallback 缓存计算结果和函数
3. 代码分割和懒加载
4. 虚拟列表优化长列表渲染

通过这些技术可以显著提升应用的性能和用户体验。`,

    `数据库索引原理

数据库索引是提高查询性能的重要手段。索引的工作原理类似于书籍的目录，可以快速定位到数据所在的位置。

常见的索引类型：
- B树索引：适合范围查询
- 哈希索引：适合等值查询
- 全文索引：适合文本搜索

合理使用索引可以将查询速度提升几个数量级。`,
  ];

  const docs = createDocsFromTexts(sampleTexts, "article");
  console.log(`   创建了 ${docs.length} 个文档\n`);

  // 2. 文档分块
  console.log("✂️  步骤 2: 文档分块\n");

  const chunks = makeChunks(docs, 300, 50);
  console.log(`   分块完成: ${chunks.length} 个块\n`);

  // 3. 向量化并存储
  console.log("🔢 步骤 3: 向量化并存储\n");

  const vectorStore = new SimpleVectorStore();
  await vectorStore.addDocuments(chunks);
  console.log(`   向量库中共有 ${vectorStore.getDocumentCount()} 个文档\n`);

  // 4. 相似度搜索
  console.log("🔍 步骤 4: 相似度搜索\n");

  const queries = [
    "如何使用 LangChain 进行开发？",
    "向量搜索的原理是什么？",
    "React 如何优化性能？",
  ];

  for (const query of queries) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📌 查询: "${query}"\n`);

    const results = await vectorStore.similaritySearch(query, 3);

    console.log("   搜索结果:\n");
    results.forEach((result, idx) => {
      const scoreBar = "▓".repeat(Math.round(result.score * 30));
      console.log(`   ${idx + 1}. 相似度: ${result.score.toFixed(4)} ${scoreBar}`);
      console.log(`      来源: ${result.meta?.id || "未知"}`);
      console.log(`      内容: ${result.text.slice(0, 100)}...`);
      console.log();
    });
  }

  // 5. 带过滤的搜索
  console.log("\n🎯 步骤 5: 带元数据过滤的搜索\n");
  console.log(`   查询: "性能优化技巧"`);
  console.log(`   过滤条件: 只搜索 article-2 相关的内容\n`);

  const filteredResults = await vectorStore.similaritySearchWithFilter(
    "性能优化技巧",
    3,
    (meta) => meta?.id?.startsWith("article-2")
  );

  console.log("   过滤后的结果:\n");
  filteredResults.forEach((result, idx) => {
    console.log(`   ${idx + 1}. 相似度: ${result.score.toFixed(4)}`);
    console.log(`      来源: ${result.meta?.id}`);
    console.log(`      内容: ${result.text.slice(0, 100)}...`);
    console.log();
  });

  // 6. MMR 搜索（多样性）
  console.log("\n🎲 步骤 6: MMR 搜索（平衡相关性与多样性）\n");
  console.log(`   查询: "技术优化"`);
  console.log(`   参数: lambda=0.5 (平衡相关性和多样性)\n`);

  const mmrResults = await vectorStore.maxMarginalRelevanceSearch(
    "技术优化",
    3,
    0.5
  );

  console.log("   MMR 结果（更多样化）:\n");
  mmrResults.forEach((result, idx) => {
    console.log(`   ${idx + 1}. 相似度: ${result.score.toFixed(4)}`);
    console.log(`      来源: ${result.meta?.id}`);
    console.log(`      内容: ${result.text.slice(0, 80)}...`);
    console.log();
  });

  console.log("✅ 示例完成！\n");
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
