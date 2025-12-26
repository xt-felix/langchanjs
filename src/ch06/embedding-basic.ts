/**
 * 向量化基础示例 - 演示 Embedding 的基本用法
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 计算余弦相似度
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * 计算欧氏距离
 */
function euclideanDistance(vec1: number[], vec2: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  return Math.sqrt(sum);
}

/**
 * 主函数
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║              向量化基础示例 - Embedding 演示                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 创建 Embeddings 实例
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small", // 1536 维向量
  });

  // 示例文本
  const texts = [
    "LangChain 是一个强大的 AI 应用开发框架",
    "LangChain.js 支持构建复杂的 AI 应用",
    "今天天气真好，适合出去玩",
    "React 是一个前端框架",
  ];

  console.log("📝 待向量化的文本：");
  texts.forEach((text, idx) => {
    console.log(`   ${idx + 1}. ${text}`);
  });

  // 批量向量化
  console.log("\n🔄 正在进行向量化...");
  const vectors = await embeddings.embedDocuments(texts);

  console.log(`✅ 向量化完成！`);
  console.log(`   - 向量维度: ${vectors[0].length}`);
  console.log(`   - 向量数量: ${vectors.length}`);
  console.log(`   - 向量示例（前5维）: [${vectors[0].slice(0, 5).map(v => v.toFixed(4)).join(", ")}...]`);

  // 计算相似度矩阵
  console.log("\n📊 相似度矩阵（余弦相似度）：\n");

  console.log("     ", texts.map((_, i) => `文本${i + 1}`).join("  "));
  console.log("     ", "-".repeat(50));

  for (let i = 0; i < vectors.length; i++) {
    const row: string[] = [];
    for (let j = 0; j < vectors.length; j++) {
      const similarity = cosineSimilarity(vectors[i], vectors[j]);
      row.push(similarity.toFixed(3));
    }
    console.log(`文本${i + 1}: ${row.join("  ")}`);
  }

  // 分析结果
  console.log("\n💡 相似度分析：\n");

  // 最相似的文本对
  const sim_0_1 = cosineSimilarity(vectors[0], vectors[1]);
  const sim_0_2 = cosineSimilarity(vectors[0], vectors[2]);
  const sim_0_3 = cosineSimilarity(vectors[0], vectors[3]);

  console.log(`   文本1 vs 文本2 (都关于 LangChain): ${sim_0_1.toFixed(4)} ⭐ 最相似`);
  console.log(`   文本1 vs 文本3 (不相关):          ${sim_0_2.toFixed(4)} ❌ 不相似`);
  console.log(`   文本1 vs 文本4 (稍微相关):        ${sim_0_3.toFixed(4)}`);

  // 查询示例
  console.log("\n🔍 查询示例：");
  const query = "如何使用 LangChain 构建应用？";
  console.log(`   查询: "${query}"\n`);

  const queryVector = await embeddings.embedQuery(query);

  const results = texts.map((text, idx) => ({
    text,
    similarity: cosineSimilarity(queryVector, vectors[idx]),
  }));

  results.sort((a, b) => b.similarity - a.similarity);

  console.log("   搜索结果（按相似度排序）：");
  results.forEach((result, idx) => {
    const bar = "█".repeat(Math.round(result.similarity * 50));
    console.log(`   ${idx + 1}. [${result.similarity.toFixed(4)}] ${bar}`);
    console.log(`      ${result.text}\n`);
  });

  // 欧氏距离示例
  console.log("📏 欧氏距离对比：\n");
  for (let i = 0; i < texts.length; i++) {
    const distance = euclideanDistance(queryVector, vectors[i]);
    console.log(`   查询 vs 文本${i + 1}: ${distance.toFixed(4)} (距离越小越相似)`);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
