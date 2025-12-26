/**
 * 文档分块工具 - 将长文档分割成合适大小的块
 */

import type { RawDoc } from "./loaders";

/**
 * 文档块类型定义
 */
export type Chunk = {
  id: string;         // 块的唯一标识
  text: string;       // 块的文本内容
  meta?: Record<string, any>;  // 元数据
};

/**
 * 清洗文本 - 移除多余的空白字符
 * @param text - 原始文本
 * @returns 清洗后的文本
 */
export function clean(text: string): string {
  return text
    .replace(/\r/g, "\n")           // 统一换行符
    .replace(/\n{3,}/g, "\n\n")     // 最多保留两个换行符
    .replace(/[\t\u00A0]+/g, " ")   // 制表符和不间断空格替换为普通空格
    .trim();                         // 去除首尾空白
}

/**
 * 将文本分割成固定大小的块（带重叠）
 * @param text - 文本内容
 * @param chunkSize - 每块的大小（字符数）
 * @param overlap - 重叠大小（字符数）
 * @returns 文本块数组
 */
export function splitIntoChunks(
  text: string,
  chunkSize = 800,
  overlap = 100
): string[] {
  const chunks: string[] = [];
  let i = 0;

  // 如果文本长度小于块大小，直接返回
  if (text.length <= chunkSize) {
    return [text];
  }

  while (i < text.length) {
    const slice = text.slice(i, i + chunkSize);
    chunks.push(slice);

    // 移动到下一个块的起始位置（考虑重叠）
    i += chunkSize - overlap;
  }

  return chunks;
}

/**
 * 将多个文档分块
 * @param docs - 文档数组
 * @param chunkSize - 块大小
 * @param overlap - 重叠大小
 * @returns 文档块数组
 */
export function makeChunks(
  docs: RawDoc[],
  chunkSize = 800,
  overlap = 100
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const doc of docs) {
    const cleanedText = clean(doc.text);
    const parts = splitIntoChunks(cleanedText, chunkSize, overlap);

    parts.forEach((part, idx) => {
      chunks.push({
        id: `${doc.id}#${idx}`,
        text: part,
        meta: {
          ...(doc.meta || {}),
          chunkIndex: idx,
          totalChunks: parts.length,
        },
      });
    });
  }

  console.log(`✅ 成功将 ${docs.length} 个文档分割成 ${chunks.length} 个块`);
  return chunks;
}

/**
 * 按句子边界分块（更智能的分块策略）
 * @param text - 文本内容
 * @param maxChunkSize - 最大块大小
 * @returns 文本块数组
 */
export function splitBySentence(
  text: string,
  maxChunkSize = 800
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // 按句子分割（简化版，实际生产中可能需要更复杂的分句逻辑）
  const sentences = text.split(/([。！？\.\!\?]\s*)/);

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || "");

    if (currentChunk.length + sentence.length <= maxChunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  // 添加最后一个块
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter((chunk) => chunk.trim().length > 0);
}
