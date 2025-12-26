/**
 * 模拟向量数据库 - 基于内存的简单实现
 * 实际生产环境应使用 Chroma/Pinecone/Weaviate 等专业向量数据库
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import type { Chunk } from "./chunk";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 向量文档类型
 */
type VectorDoc = {
  id: string;
  text: string;
  vector: number[];
  meta?: Record<string, any>;
};

/**
 * 计算余弦相似度
 * @param vec1 - 向量1
 * @param vec2 - 向量2
 * @returns 相似度（0-1之间）
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("向量维度不匹配");
  }

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
 * 简单的内存向量数据库
 */
export class SimpleVectorStore {
  private documents: VectorDoc[] = [];
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
    });
  }

  /**
   * 添加文档到向量库
   * @param chunks - 文档块数组
   */
  async addDocuments(chunks: Chunk[]): Promise<void> {
    console.log(`📝 开始向量化 ${chunks.length} 个文档块...`);

    // 批量获取向量
    const texts = chunks.map((c) => c.text);
    const vectors = await this.embeddings.embedDocuments(texts);

    // 存储文档和向量
    for (let i = 0; i < chunks.length; i++) {
      this.documents.push({
        id: chunks[i].id,
        text: chunks[i].text,
        vector: vectors[i],
        meta: chunks[i].meta,
      });
    }

    console.log(`✅ 成功向量化并存储 ${chunks.length} 个文档块`);
  }

  /**
   * 相似度搜索
   * @param query - 查询文本
   * @param k - 返回前 K 个最相似的文档
   * @returns 搜索结果
   */
  async similaritySearch(
    query: string,
    k: number = 5
  ): Promise<Array<{ text: string; score: number; meta?: any }>> {
    // 将查询转换为向量
    const queryVector = await this.embeddings.embedQuery(query);

    // 计算所有文档与查询的相似度
    const results = this.documents.map((doc) => ({
      text: doc.text,
      score: cosineSimilarity(queryVector, doc.vector),
      meta: doc.meta,
    }));

    // 按相似度排序并返回前 K 个
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  /**
   * 带过滤的相似度搜索
   * @param query - 查询文本
   * @param k - 返回前 K 个
   * @param filter - 元数据过滤函数
   * @returns 搜索结果
   */
  async similaritySearchWithFilter(
    query: string,
    k: number = 5,
    filter?: (meta: any) => boolean
  ): Promise<Array<{ text: string; score: number; meta?: any }>> {
    // 将查询转换为向量
    const queryVector = await this.embeddings.embedQuery(query);

    // 过滤文档
    let filteredDocs = this.documents;
    if (filter) {
      filteredDocs = this.documents.filter((doc) => filter(doc.meta));
    }

    // 计算相似度
    const results = filteredDocs.map((doc) => ({
      text: doc.text,
      score: cosineSimilarity(queryVector, doc.vector),
      meta: doc.meta,
    }));

    // 排序并返回
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  /**
   * MMR 搜索（平衡相关性和多样性）
   * @param query - 查询文本
   * @param k - 返回前 K 个
   * @param lambda - 平衡参数（0-1，越大越注重相关性）
   * @returns 搜索结果
   */
  async maxMarginalRelevanceSearch(
    query: string,
    k: number = 5,
    lambda: number = 0.5
  ): Promise<Array<{ text: string; score: number; meta?: any }>> {
    // 获取候选集（更多的候选）
    const candidates = await this.similaritySearch(query, k * 3);
    const queryVector = await this.embeddings.embedQuery(query);

    const selected: typeof candidates = [];
    const remaining = [...candidates];

    while (selected.length < k && remaining.length > 0) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      // 计算每个候选的 MMR 分数
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // 相关性分数
        const relevance = candidate.score;

        // 多样性分数（与已选择文档的最大相似度）
        let maxSimilarity = 0;
        if (selected.length > 0) {
          for (const selected_doc of selected) {
            const candidateDoc = this.documents.find(
              (d) => d.text === candidate.text
            );
            const selectedDoc = this.documents.find(
              (d) => d.text === selected_doc.text
            );

            if (candidateDoc && selectedDoc) {
              const sim = cosineSimilarity(
                candidateDoc.vector,
                selectedDoc.vector
              );
              maxSimilarity = Math.max(maxSimilarity, sim);
            }
          }
        }

        // MMR 分数
        const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIdx = i;
        }
      }

      // 选择最佳候选
      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return selected;
  }

  /**
   * 获取所有文档数量
   */
  getDocumentCount(): number {
    return this.documents.length;
  }

  /**
   * 清空向量库
   */
  clear(): void {
    this.documents = [];
    console.log("✅ 向量库已清空");
  }
}
