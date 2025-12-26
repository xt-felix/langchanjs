/**
 * 文档加载器 - 支持从不同来源加载文档
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * 原始文档类型定义
 */
export type RawDoc = {
  id: string;         // 文档唯一标识
  text: string;       // 文档内容
  meta?: Record<string, any>;  // 元数据（来源、类型等）
};

/**
 * 从 Markdown 目录加载所有文档
 * @param dir - 目录路径
 * @returns 文档数组
 */
export async function loadMarkdownDir(dir: string): Promise<RawDoc[]> {
  const docs: RawDoc[] = [];

  try {
    const files = await fs.readdir(dir);

    for (const f of files) {
      if (!f.endsWith(".md")) continue;

      const full = path.join(dir, f);
      const text = await fs.readFile(full, "utf8");

      docs.push({
        id: f,
        text,
        meta: {
          source: full,
          type: "markdown",
          fileName: f,
        },
      });
    }

    console.log(`✅ 成功加载 ${docs.length} 个 Markdown 文档`);
    return docs;
  } catch (error: any) {
    console.error(`❌ 加载文档失败:`, error.message);
    return [];
  }
}

/**
 * 从文本文件加载文档
 * @param filePath - 文件路径
 * @returns 文档对象
 */
export async function loadTextFile(filePath: string): Promise<RawDoc | null> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    const fileName = path.basename(filePath);

    return {
      id: fileName,
      text,
      meta: {
        source: filePath,
        type: "text",
        fileName,
      },
    };
  } catch (error: any) {
    console.error(`❌ 加载文件失败:`, error.message);
    return null;
  }
}

/**
 * 从内存中的文本数组创建文档
 * @param texts - 文本数组
 * @param prefix - ID 前缀
 * @returns 文档数组
 */
export function createDocsFromTexts(
  texts: string[],
  prefix: string = "doc"
): RawDoc[] {
  return texts.map((text, idx) => ({
    id: `${prefix}-${idx}`,
    text,
    meta: {
      source: "memory",
      type: "text",
      index: idx,
    },
  }));
}
