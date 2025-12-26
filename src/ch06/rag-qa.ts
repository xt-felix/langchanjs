/**
 * RAG 问答系统示例 - 基于检索增强生成
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { SimpleVectorStore } from "./simple-vector-store";
import { createDocsFromTexts } from "./loaders";
import { makeChunks } from "./chunk";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * RAG 问答引擎
 */
export class RAGQuestionAnswering {
  private vectorStore: SimpleVectorStore;
  private llm: ChatOpenAI;
  private chain: any;

  constructor() {
    this.vectorStore = new SimpleVectorStore();
    this.llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });

    // 构建 RAG 链
    this.chain = this.createRAGChain();
  }

  /**
   * 创建 RAG 处理链
   */
  private createRAGChain() {
    // 定义 Prompt 模板
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `你是一个专业的技术问答助手。请严格基于提供的上下文信息回答问题。

规则：
1. 只使用上下文中的信息回答
2. 如果上下文不包含答案，明确说明"根据提供的信息无法回答该问题"
3. 回答要准确、简洁、有条理
4. 如果可能，引用原文片段
`,
      ],
      [
        "human",
        `上下文信息：
{context}

问题：{question}

请回答：`,
      ],
    ]);

    // 构建链
    return RunnableSequence.from([
      // 步骤 1：检索相关文档
      async (input: { question: string; k?: number }) => {
        const results = await this.vectorStore.similaritySearch(
          input.question,
          input.k || 5
        );

        // 组装上下文
        const context = results
          .map((r, idx) => `[片段 ${idx + 1}]\n${r.text}`)
          .join("\n\n---\n\n");

        return {
          question: input.question,
          context,
          sources: results.map((r) => r.meta),
        };
      },

      // 步骤 2：调用 LLM 生成答案
      async (input: { question: string; context: string; sources: any[] }) => {
        const response = await prompt
          .pipe(this.llm)
          .pipe(new StringOutputParser())
          .invoke({
            question: input.question,
            context: input.context,
          });

        return {
          answer: response,
          sources: input.sources,
          question: input.question,
        };
      },
    ]);
  }

  /**
   * 添加知识库文档
   */
  async addDocuments(
    chunks: Array<{ id: string; text: string; meta?: any }>
  ): Promise<void> {
    await this.vectorStore.addDocuments(chunks);
  }

  /**
   * 提问
   * @param question - 问题
   * @param k - 检索文档数量
   * @returns 答案和来源
   */
  async ask(
    question: string,
    k: number = 5
  ): Promise<{ answer: string; sources: any[]; question: string }> {
    return await this.chain.invoke({ question, k });
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║            RAG 问答系统示例 - 检索增强生成                     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // 1. 准备知识库
  console.log("📚 步骤 1: 构建知识库\n");

  const knowledgeBase = [
    `LangChain 架构设计

LangChain 采用模块化架构设计，核心模块包括：

1. Models（模型层）
   - 支持多种 LLM 提供商（OpenAI、Anthropic、HuggingFace 等）
   - 统一的接口设计
   - 支持流式输出

2. Prompts（提示词层）
   - PromptTemplate：参数化提示词模板
   - ChatPromptTemplate：对话式提示词
   - FewShotPromptTemplate：少样本学习模板

3. Chains（链层）
   - 顺序链（SequentialChain）
   - 路由链（RouterChain）
   - 转换链（TransformChain）

4. Memory（记忆层）
   - BufferMemory：完整保存历史
   - WindowMemory：滑动窗口
   - SummaryMemory：摘要压缩

5. Agents（代理层）
   - 工具调用
   - 决策规划
   - 任务执行`,

    `向量数据库技术详解

向量数据库是专门用于存储和检索高维向量的数据库系统。

核心技术：
1. 索引算法
   - HNSW（分层可导航小世界图）：查询快，内存占用大
   - IVF（倒排文件索引）：平衡性能和内存
   - Product Quantization：高压缩比

2. 相似度度量
   - 余弦相似度：最常用，范围 [-1, 1]
   - 欧氏距离：L2 距离，适合密集向量
   - 点积：计算快，需要归一化

3. 性能优化
   - 批量插入提升吞吐量
   - 预过滤减少计算量
   - 向量压缩节省存储

最佳实践：
- 选择合适的相似度度量
- 合理设置分块大小（800-1200 字符）
- 使用元数据过滤优化查询
- 定期评估检索质量`,

    `RAG 系统设计模式

检索增强生成（RAG）是提升 LLM 应用准确性的关键技术。

核心流程：
1. 文档预处理
   - 加载文档（PDF、Markdown、HTML）
   - 清洗文本（去除噪声）
   - 分块处理（保持语义完整）
   - 向量化存储

2. 查询处理
   - 查询改写（提升召回）
   - 向量检索（TopK）
   - 重排序（Rerank）
   - 上下文组装

3. 答案生成
   - Prompt 工程
   - LLM 调用
   - 结果验证
   - 来源追溯

高级技巧：
- 混合搜索：BM25 + 向量搜索
- 多路召回：不同策略召回后融合
- 迭代检索：根据中间结果多次检索
- 答案验证：检查答案与上下文的一致性`,

    `实战：构建企业知识库问答系统

项目需求：
- 支持多格式文档（PDF、Word、Markdown）
- 亿级文档规模
- 毫秒级响应
- 99.9% 可用性

技术选型：
1. 文档处理：LangChain Document Loaders
2. 向量数据库：Pinecone（托管）或 Weaviate（自建）
3. LLM：GPT-3.5-turbo（成本效益）
4. 缓存：Redis（热点问题）

架构设计：
- 异步处理管道（文档索引）
- 分布式检索（多副本）
- 智能路由（问题分类）
- 降级策略（关键词搜索兜底）

性能优化：
- 批量向量化（降低API调用）
- 向量缓存（相同文本复用）
- 查询缓存（相似问题复用）
- 连接池（复用数据库连接）

监控指标：
- 检索召回率（Recall）
- 答案准确率（Accuracy）
- 响应时间（P50/P95/P99）
- 错误率
- Token 消耗`,
  ];

  const docs = createDocsFromTexts(knowledgeBase, "kb");
  const chunks = makeChunks(docs, 500, 50);

  console.log(`   加载了 ${chunks.length} 个知识片段\n`);

  // 2. 初始化 RAG 引擎
  console.log("🔧 步骤 2: 初始化 RAG 引擎\n");

  const rag = new RAGQuestionAnswering();
  await rag.addDocuments(chunks);

  console.log("✅ RAG 引擎初始化完成\n");

  // 3. 测试问答
  const questions = [
    "LangChain 有哪些核心模块？",
    "向量数据库有哪些索引算法？",
    "如何优化 RAG 系统的性能？",
    "企业知识库问答系统应该如何选型？",
    "什么是量子计算？", // 知识库中没有的问题
  ];

  for (const question of questions) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\n❓ 问题: ${question}\n`);

    try {
      const result = await rag.ask(question, 3);

      console.log("💡 答案:\n");
      console.log(`${result.answer}\n`);

      console.log("📎 参考来源:");
      result.sources.forEach((source, idx) => {
        console.log(`   ${idx + 1}. ${source?.id || "未知"}`);
      });
      console.log();
    } catch (error: any) {
      console.error(`❌ 错误: ${error.message}\n`);
    }
  }

  console.log("✅ RAG 问答示例完成！\n");
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
