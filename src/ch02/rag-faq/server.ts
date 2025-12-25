import "dotenv/config";
import { askQuestion, formatQAResult } from "./answer";
import { ingestDocuments } from "./ingest";
import { getKnowledgeBaseStats } from "./retriever";
import { join } from "path";

/**
 * FAQ RAG Chat 服务器
 * 
 * 提供两种模式：
 * 1. 命令行交互模式
 * 2. 批量评测模式
 */

/**
 * 显示欢迎信息
 */
function showWelcome() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║            🤖 FAQ RAG Chat System 🤖                          ║
║                                                                ║
║         基于 LangChain.js 的智能问答系统                        ║
║         特性：结构化答案 | 来源引用 | 低幻觉                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
}

/**
 * 单个问题测试
 */
async function testSingleQuestion(question: string) {
  console.log(`\n📝 用户问题: ${question}`);

  try {
    const result = await askQuestion(question, {
      topK: 3,
      temperature: 0,
    });

    console.log(formatQAResult(result));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ 错误: ${error.message}`);
    } else {
      console.error(`❌ 未知错误:`, error);
    }
  }
}

/**
 * 批量测试问题
 */
async function testMultipleQuestions(questions: string[]) {
  console.log(`\n🔬 批量测试模式 - 共 ${questions.length} 个问题\n`);

  const results = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`\n[${i + 1}/${questions.length}] 测试问题: ${question}`);

    try {
      const result = await askQuestion(question, {
        topK: 3,
        temperature: 0,
      });

      results.push({ question, result, success: true });
      console.log(formatQAResult(result));
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ 失败: ${error.message}`);
      }
      results.push({ question, error, success: false });
    }

    // 添加延迟避免 API 限流
    if (i < questions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // 显示统计
  const successCount = results.filter((r) => r.success).length;
  const avgConfidence =
    results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + (r.result?.confidence ?? 0), 0) / successCount;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 测试统计`);
  console.log(`${"=".repeat(60)}`);
  console.log(`总问题数: ${questions.length}`);
  console.log(`成功: ${successCount} (${((successCount / questions.length) * 100).toFixed(1)}%)`);
  console.log(`失败: ${results.length - successCount}`);
  console.log(`平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`${"=".repeat(60)}\n`);
}

/**
 * 30+ 常见问题的 Gold Set（用于评测）
 */
const goldSetQuestions = [
  // 基础概念类
  "什么是 LangChain.js？",
  "LangChain.js 有哪些主要特性？",
  "LangChain.js 支持哪些 LLM 提供商？",

  // 安装配置类
  "如何安装 LangChain.js？",
  "LangChain.js 需要什么版本的 Node.js？",
  "怎么用 yarn 安装 LangChain？",

  // Prompt 相关
  "如何使用 Prompt 模板？",
  "ChatPromptTemplate 怎么用？",
  "Prompt 模板支持变量替换吗？",
  "怎么定义系统消息和用户消息？",

  // 输出解析
  "LangChain.js 有哪些输出解析器？",
  "如何解析 JSON 输出？",
  "JsonOutputParser 怎么使用？",
  "什么是 StructuredOutputParser？",

  // 链式调用
  "什么是 RunnableSequence？",
  "如何创建处理链？",
  "链式调用可以传递中间结果吗？",
  "怎么组合多个步骤？",

  // RAG 相关
  "什么是 RAG？",
  "RAG 的完整流程是什么？",
  "如何实现检索增强生成？",
  "RAG 能降低模型幻觉吗？",
  "RAG 需要用到向量数据库吗？",

  // 错误处理
  "API Key 未设置怎么办？",
  "遇到超时错误怎么处理？",
  "如何处理 Rate Limit？",
  "怎么调试 LangChain 应用？",
  "如何启用 verbose 模式？",

  // 成本相关
  "GPT-4 的价格是多少？",
  "GPT-3.5-turbo 多少钱？",
  "开发测试用什么模型好？",
  "如何降低 API 使用成本？",

  // 边界测试（应该返回"不知道"）
  "LangChain 支持 Python 吗？",
  "如何部署到生产环境？",
  "怎么实现多模态对话？",
];

/**
 * 主函数
 */
async function main() {
  showWelcome();

  // 检查环境变量
  if (!process.env.OPENAI_API_KEY) {
    console.error(`
⚠️  警告: 未检测到 OPENAI_API_KEY 环境变量

请创建 .env 文件并添加：
OPENAI_API_KEY=your-api-key-here

或在命令行中设置：
export OPENAI_API_KEY=your-api-key-here
`);
    process.exit(1);
  }

  // 显示知识库状态
  const stats = getKnowledgeBaseStats();
  console.log(`📚 知识库状态:`);
  console.log(`   - 文档片段: ${stats.totalChunks} 个`);
  console.log(`   - 来源文件: ${stats.sources.length} 个`);
  console.log(`   - 分类: ${stats.categories.join(", ")}\n`);

  // 从命令行参数获取模式
  const args = process.argv.slice(2);
  const mode = args[0] || "interactive";

  if (mode === "ingest") {
    // 数据加载模式
    const dataDir = args[1] || join(__dirname, "data");
    console.log(`📥 数据加载模式 - 目录: ${dataDir}\n`);

    const totalChunks = ingestDocuments({
      dataDir,
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    console.log(`\n✅ 加载完成！共 ${totalChunks} 个片段`);
  } else if (mode === "test") {
    // 单个问题测试
    const question = args.slice(1).join(" ") || "什么是 LangChain.js？";
    await testSingleQuestion(question);
  } else if (mode === "batch") {
    // 批量测试模式
    await testMultipleQuestions(goldSetQuestions);
  } else if (mode === "interactive") {
    // 交互模式
    console.log(`🎯 交互模式`);
    console.log(`提示: 使用以下命令运行其他模式：`);
    console.log(`   - npm run rag-faq test "你的问题"    # 测试单个问题`);
    console.log(`   - npm run rag-faq batch             # 批量测试 30+ 问题`);
    console.log(`   - npm run rag-faq ingest ./data     # 加载文档数据\n`);

    // 运行几个示例问题
    const exampleQuestions = [
      "什么是 LangChain.js？",
      "如何使用 Prompt 模板？",
      "什么是 RAG？",
    ];

    for (const question of exampleQuestions) {
      await testSingleQuestion(question);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } else {
    console.error(`❌ 未知模式: ${mode}`);
    console.log(`\n可用模式:`);
    console.log(`   - interactive (默认) - 运行示例问题`);
    console.log(`   - test <question>    - 测试单个问题`);
    console.log(`   - batch              - 批量测试 30+ 问题`);
    console.log(`   - ingest <dir>       - 从目录加载文档`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ 程序错误:", error);
    process.exit(1);
  });
}

export { main };

