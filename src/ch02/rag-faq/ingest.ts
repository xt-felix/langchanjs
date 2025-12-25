import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import {
  DocumentChunk,
  addDocumentToKnowledgeBase,
  getKnowledgeBaseStats,
} from "./retriever";

/**
 * 文档加载配置
 */
export interface IngestConfig {
  dataDir: string; // 数据目录路径
  chunkSize?: number; // 分块大小（字符数）
  chunkOverlap?: number; // 分块重叠（字符数）
  extensions?: string[]; // 允许的文件扩展名
}

/**
 * 文本分割器
 * 将长文本分割成适合处理的小块
 * 
 * @param text - 原始文本
 * @param chunkSize - 块大小
 * @param overlap - 重叠大小
 * @returns 分割后的文本数组
 */
function splitText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // 尝试在句子边界处分割（寻找句号、问号、感叹号）
    if (end < text.length) {
      const lastPunctuation = Math.max(
        chunk.lastIndexOf("。"),
        chunk.lastIndexOf("！"),
        chunk.lastIndexOf("？"),
        chunk.lastIndexOf("."),
        chunk.lastIndexOf("!"),
        chunk.lastIndexOf("?"),
        chunk.lastIndexOf("\n")
      );

      if (lastPunctuation > chunkSize / 2) {
        chunk = chunk.slice(0, lastPunctuation + 1);
      }
    }

    chunks.push(chunk.trim());

    // 移动起始位置，考虑重叠
    start = start + chunk.length - overlap;
    if (start <= 0) start = chunk.length; // 防止无限循环
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * 从 Markdown 文件中提取元数据
 * 
 * @param content - 文件内容
 * @returns 元数据对象
 */
function extractMetadataFromMarkdown(content: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  // 提取标题（第一个 # 标题）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // 提取 YAML Front Matter（如果有）
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontMatterMatch) {
    const yamlContent = frontMatterMatch[1];
    const lines = yamlContent.split("\n");

    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        const value = valueParts.join(":").trim();
        metadata[key.trim()] = value;
      }
    }
  }

  // 提取标签（查找 tags: 或 关键词： 行）
  const tagsMatch = content.match(/(?:tags|关键词):\s*(.+)/i);
  if (tagsMatch) {
    const tagsStr = tagsMatch[1].trim();
    metadata.tags = tagsStr.split(/[,，]/).map((t) => t.trim());
  }

  return metadata;
}

/**
 * 加载单个文件
 * 
 * @param filePath - 文件路径
 * @param config - 配置
 * @returns 文档片段数组
 */
export function loadFile(
  filePath: string,
  config: Partial<IngestConfig> = {}
): DocumentChunk[] {
  const chunkSize = config.chunkSize ?? 1000;
  const chunkOverlap = config.chunkOverlap ?? 200;

  try {
    // 读取文件内容
    const content = readFileSync(filePath, "utf-8");

    // 提取元数据
    const metadata = extractMetadataFromMarkdown(content);

    // 分割文本
    const textChunks = splitText(content, chunkSize, chunkOverlap);

    // 创建文档片段
    const documentChunks: DocumentChunk[] = textChunks.map((chunk, index) => ({
      id: `${filePath.split("/").pop()}-chunk-${index + 1}`,
      content: chunk,
      source: filePath,
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: textChunks.length,
      },
    }));

    return documentChunks;
  } catch (error) {
    console.error(`加载文件失败: ${filePath}`, error);
    return [];
  }
}

/**
 * 递归加载目录中的所有文件
 * 
 * @param dirPath - 目录路径
 * @param extensions - 允许的文件扩展名
 * @returns 文件路径数组
 */
function getFilesRecursively(
  dirPath: string,
  extensions: string[] = [".md", ".txt"]
): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // 递归处理子目录
        files.push(...getFilesRecursively(fullPath, extensions));
      } else if (stat.isFile()) {
        // 检查文件扩展名
        const ext = extname(entry);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`读取目录失败: ${dirPath}`, error);
  }

  return files;
}

/**
 * 从目录加载所有文档并向量化
 * 
 * @param config - 加载配置
 * @returns 加载的文档片段总数
 */
export function ingestDocuments(config: IngestConfig): number {
  const extensions = config.extensions ?? [".md", ".txt"];
  let totalChunks = 0;

  console.log(`\n[文档加载] 开始从目录加载: ${config.dataDir}`);
  console.log(`[文档加载] 允许的文件类型: ${extensions.join(", ")}`);

  // 获取所有文件
  const files = getFilesRecursively(config.dataDir, extensions);
  console.log(`[文档加载] 找到 ${files.length} 个文件`);

  // 加载每个文件
  for (const file of files) {
    console.log(`[文档加载] 处理文件: ${file}`);
    const chunks = loadFile(file, config);

    // 添加到知识库
    for (const chunk of chunks) {
      addDocumentToKnowledgeBase(chunk);
      totalChunks++;
    }

    console.log(`[文档加载] 生成 ${chunks.length} 个片段`);
  }

  // 显示统计信息
  const stats = getKnowledgeBaseStats();
  console.log(`\n[文档加载] 完成！`);
  console.log(`[文档加载] 总片段数: ${stats.totalChunks}`);
  console.log(`[文档加载] 来源文件: ${stats.sources.length} 个`);
  console.log(`[文档加载] 分类: ${stats.categories.join(", ")}`);

  return totalChunks;
}

/**
 * 从文本内容直接创建文档片段（用于测试）
 * 
 * @param content - 文本内容
 * @param source - 来源标识
 * @param config - 配置
 * @returns 文档片段数组
 */
export function ingestFromText(
  content: string,
  source: string = "inline-text",
  config: Partial<IngestConfig> = {}
): DocumentChunk[] {
  const chunkSize = config.chunkSize ?? 1000;
  const chunkOverlap = config.chunkOverlap ?? 200;

  const metadata = extractMetadataFromMarkdown(content);
  const textChunks = splitText(content, chunkSize, chunkOverlap);

  const documentChunks: DocumentChunk[] = textChunks.map((chunk, index) => ({
    id: `${source}-chunk-${index + 1}`,
    content: chunk,
    source,
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: textChunks.length,
    },
  }));

  // 添加到知识库
  documentChunks.forEach(addDocumentToKnowledgeBase);

  return documentChunks;
}

