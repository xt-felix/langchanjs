/**
 * LangGraph：在状态图中管理记忆
 * 
 * LangGraph 是一个用于构建有状态、多步骤应用的框架。
 * 可以将 Memory 作为状态的一部分，在节点间共享。
 * 
 * 注意：这是简化示例，实际使用需要安装 @langchain/langgraph
 */

import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

/**
 * 图状态类型定义
 */
type GraphState = {
  history: Array<{ role: string; content: string }>;
  input: string;
  output?: string;
};

/**
 * 简化的状态图实现（伪代码）
 * 
 * 实际使用 LangGraph 时：
 * 1. 安装：npm install @langchain/langgraph
 * 2. 使用 StateGraph 构建图
 * 3. 在节点中读取和更新 state.history
 */
export class SimpleStateGraph {
  private state: GraphState;

  constructor(initialState: Partial<GraphState> = {}) {
    this.state = {
      history: [],
      input: "",
      ...initialState,
    };
  }

  /**
   * LLM 节点：处理用户输入并更新历史
   */
  async llmNode(input: string): Promise<string> {
    // 更新状态
    this.state.input = input;

    // 创建 Prompt（包含历史）
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "你是技术助手，回答要简洁实用。"],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);

    // 调用模型
    const model = new ChatOpenAI({ temperature: 0 });
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const output = await chain.invoke({
      history: this.state.history,
      input: this.state.input,
    });

    // 更新状态
    this.state.output = output;
    this.state.history.push(
      { role: "human", content: input },
      { role: "ai", content: output }
    );

    return output;
  }

  /**
   * 获取当前状态
   */
  getState(): GraphState {
    return { ...this.state };
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.state.history = [];
  }
}

/**
 * 使用示例
 */
if (require.main === module) {
  (async () => {
    console.log("=== LangGraph 状态图演示 ===\n");

    const graph = new SimpleStateGraph();

    console.log("第 1 轮对话:");
    const res1 = await graph.llmNode("什么是 React？");
    console.log("AI:", res1);
    console.log("当前历史消息数:", graph.getState().history.length);
    console.log("\n---\n");

    console.log("第 2 轮对话:");
    const res2 = await graph.llmNode("它有什么优势？");
    console.log("AI:", res2);
    console.log("当前历史消息数:", graph.getState().history.length);
    console.log("\n---\n");

    console.log("查看完整状态:");
    console.log(JSON.stringify(graph.getState(), null, 2));
  })();
}

/**
 * 实际 LangGraph 使用示例（需要安装 @langchain/langgraph）
 * 
 * import { StateGraph, END } from "@langchain/langgraph";
 * 
 * const graph = new StateGraph<GraphState>({
 *   channels: {
 *     history: { reducer: (x, y) => [...x, ...y], default: () => [] },
 *     input: { reducer: (x, y) => y ?? x, default: () => "" },
 *     output: { reducer: (x, y) => y ?? x, default: () => "" },
 *   },
 * });
 * 
 * graph.addNode("llm", async (state) => {
 *   // 读取 state.history
 *   // 调用 LLM
 *   // 更新 state.history 和 state.output
 *   return { output: "...", history: [...state.history, ...] };
 * });
 * 
 * graph.addEdge("start", "llm");
 * graph.addEdge("llm", "end");
 * 
 * const app = graph.compile();
 */

