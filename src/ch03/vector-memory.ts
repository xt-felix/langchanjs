/**
 * VectorStoreRetrieverMemory：事实性持久记忆
 * 
 * 原理：
 * - 将对话中的关键事实向量化存储
 * - 需要时通过语义检索召回相关事实
 * - 适合存储用户偏好、长期知识等
 * 
 * 适用场景：
 * - 个性化助手（用户偏好）
 * - 知识库问答（长期事实）
 * - 学习助手（学习记录）
 */

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
// 注意：VectorStoreRetrieverMemory 可能需要从 @langchain/community 导入
// 这里使用简化实现：手动实现向量检索逻辑
import type { BaseRetriever } from "@langchain/core/retrievers";

/**
 * 模拟向量检索器
 * 
 * 实际生产环境应该使用：
 * - Chroma
 * - Pinecone
 * - Weaviate
 * - Qdrant
 */
class FakeRetriever implements BaseRetriever {
  async getRelevantDocuments(query: string) {
    // 模拟检索结果：根据查询返回相关事实
    const facts = [
      { pageContent: `用户偏好：更喜欢暗色主题；最近关注"响应式布局"。查询=${query}` },
      { pageContent: `用户历史：之前询问过 React Hooks 和 TypeScript 相关问题。查询=${query}` },
    ];
    
    // 根据查询内容过滤
    if (query.includes("主题") || query.includes("颜色")) {
      return facts.filter(f => f.pageContent.includes("暗色主题"));
    }
    
    return facts;
  }
}

/**
 * 创建向量记忆
 * 
 * 使用 FakeRetriever 检索相关事实
 * 将检索结果作为历史上下文注入
 */
const retriever = new FakeRetriever();

// 加载记忆：通过向量检索获取相关事实
async function loadVectorMemory(query: string) {
  const docs = await retriever.getRelevantDocuments(query);
  // 转换为消息格式
  return docs.map((doc) => ({
    role: "system" as const,
    content: doc.pageContent,
  }));
}

/**
 * 创建 Prompt 模板
 */
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "你是个性化 UI 助手，回答需考虑用户偏好和历史记录。"],
  new MessagesPlaceholder("history"), // 检索到的事实会注入这里
  ["human", "{input}"],
]);

/**
 * 构建处理链
 */
const chain = RunnableSequence.from([
  // 步骤 1：加载记忆（通过向量检索）
  async (input: { input: string }) => {
    const history = await loadVectorMemory(input.input);
    return {
      input: input.input,
      history, // 检索到的相关事实
    };
  },
  
  // 步骤 2：填充 Prompt 并调用模型
  prompt,
  new ChatOpenAI({ temperature: 0 }),
  
  // 步骤 3：保存新的事实到向量库（实际实现需要向量化）
  async (output) => {
    // 注意：实际实现需要将新的事实向量化并存储
    // 这里只是演示接口
    return output;
  },
]);

/**
 * 建议函数
 */
export async function advise(q: string) {
  console.log(`\n用户问题: ${q}`);
  console.log("\n检索到的相关事实:");
  
  // 先查看检索到的内容
  const history = await loadVectorMemory(q);
  history.forEach((msg, i) => {
    console.log(`  ${i + 1}. ${msg.content}`);
  });
  
  const res = await chain.invoke({ input: q });
  console.log("\nAI 回答:", res.content || res);
  return res;
}

/**
 * 演示向量记忆
 */
if (require.main === module) {
  (async () => {
    console.log("=== 向量记忆演示 ===\n");
    console.log("向量记忆通过语义检索召回相关事实\n");
    
    await advise("请推荐首页布局方案");
    console.log("\n---\n");
    
    await advise("我喜欢什么主题？");
    console.log("\n---\n");
    
    await advise("我之前问过什么问题？");
  })();
}

