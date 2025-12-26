// 文件：src/ch04/metrics-callback.ts
// 演示：自定义 CallbackHandler 收集指标和上报进度

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { AgentAction, AgentFinish, ChainValues, LLMResult } from "@langchain/core/outputs";
import type { Serialized } from "@langchain/core/load/serializable";

/**
 * 🎯 自定义 CallbackHandler：指标收集器
 *
 * CallbackHandler 的生命周期事件：
 *
 * LLM 级别：
 * - handleLLMStart: LLM 开始执行
 * - handleLLMNewToken: 收到新的 Token（流式输出）
 * - handleLLMEnd: LLM 执行完成
 * - handleLLMError: LLM 执行出错
 *
 * Chain 级别：
 * - handleChainStart: Chain 开始执行
 * - handleChainEnd: Chain 执行完成
 * - handleChainError: Chain 执行出错
 *
 * Tool 级别：
 * - handleToolStart: Tool 开始执行
 * - handleToolEnd: Tool 执行完成
 * - handleToolError: Tool 执行出错
 */

export interface Metrics {
  llmCalls: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  errors: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export class MetricsHandler extends BaseCallbackHandler {
  name = "metrics-handler";

  // 存储指标数据
  private metrics: Metrics = {
    llmCalls: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    errors: 0,
  };

  // 存储每次调用的开始时间（用于计算耗时）
  private runTimings: Map<string, number> = new Map();

  /**
   * LLM 开始执行时触发
   */
  async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
    _parentRunId?: string,
    _extraParams?: Record<string, unknown>
  ): Promise<void> {
    this.metrics.llmCalls++;
    this.runTimings.set(runId, Date.now());

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 [LLM Start]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Model: ${llm.id ? llm.id[llm.id.length - 1] : "unknown"}`);
    console.log(`   Prompts: ${prompts.length} 条`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  /**
   * 收到新的 Token 时触发（流式输出）
   */
  async handleLLMNewToken(
    token: string,
    _idx: Record<string, number>,
    _runId: string,
    _parentRunId?: string,
    _tags?: string[],
    _fields?: Record<string, unknown>
  ): Promise<void> {
    // 实时输出 Token（打字机效果）
    process.stdout.write(token);
  }

  /**
   * LLM 执行完成时触发
   */
  async handleLLMEnd(
    output: LLMResult,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    const startTime = this.runTimings.get(runId);
    const duration = startTime ? Date.now() - startTime : 0;
    this.runTimings.delete(runId);

    // 提取 Token 使用信息
    const tokenUsage = output.llmOutput?.tokenUsage;
    if (tokenUsage) {
      this.metrics.totalTokens += tokenUsage.totalTokens || 0;
      this.metrics.promptTokens += tokenUsage.promptTokens || 0;
      this.metrics.completionTokens += tokenUsage.completionTokens || 0;
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ [LLM End]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Duration: ${duration}ms`);
    if (tokenUsage) {
      console.log(`   Token Usage:`);
      console.log(`     - Prompt Tokens: ${tokenUsage.promptTokens || 0}`);
      console.log(`     - Completion Tokens: ${tokenUsage.completionTokens || 0}`);
      console.log(`     - Total Tokens: ${tokenUsage.totalTokens || 0}`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  /**
   * LLM 执行出错时触发
   */
  async handleLLMError(
    err: Error,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    this.metrics.errors++;
    this.runTimings.delete(runId);

    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [LLM Error]");
    console.error(`   Run ID: ${runId}`);
    console.error(`   Error: ${err.message}`);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }

  /**
   * Chain 开始执行时触发
   */
  async handleChainStart(
    chain: Serialized,
    inputs: ChainValues,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    if (!this.metrics.startTime) {
      this.metrics.startTime = Date.now();
    }
    this.runTimings.set(runId, Date.now());

    console.log("\n🔗 [Chain Start]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Chain: ${chain.id ? chain.id[chain.id.length - 1] : "unknown"}`);
    console.log(`   Inputs:`, JSON.stringify(inputs, null, 2));
  }

  /**
   * Chain 执行完成时触发
   */
  async handleChainEnd(
    outputs: ChainValues,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    const startTime = this.runTimings.get(runId);
    const duration = startTime ? Date.now() - startTime : 0;
    this.runTimings.delete(runId);

    if (!this.metrics.endTime) {
      this.metrics.endTime = Date.now();
      this.metrics.duration = this.metrics.startTime
        ? this.metrics.endTime - this.metrics.startTime
        : 0;
    }

    console.log("\n✅ [Chain End]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Duration: ${duration}ms`);
  }

  /**
   * Chain 执行出错时触发
   */
  async handleChainError(
    err: Error,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    this.metrics.errors++;
    this.runTimings.delete(runId);

    console.error("\n❌ [Chain Error]");
    console.error(`   Run ID: ${runId}`);
    console.error(`   Error: ${err.message}`);
  }

  /**
   * Tool 开始执行时触发
   */
  async handleToolStart(
    tool: Serialized,
    input: string,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    this.runTimings.set(runId, Date.now());

    console.log("\n🔧 [Tool Start]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Tool: ${tool.id ? tool.id[tool.id.length - 1] : "unknown"}`);
    console.log(`   Input: ${input}`);
  }

  /**
   * Tool 执行完成时触发
   */
  async handleToolEnd(
    output: string,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    const startTime = this.runTimings.get(runId);
    const duration = startTime ? Date.now() - startTime : 0;
    this.runTimings.delete(runId);

    console.log("\n✅ [Tool End]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Output: ${output.substring(0, 100)}${output.length > 100 ? "..." : ""}`);
  }

  /**
   * Tool 执行出错时触发
   */
  async handleToolError(
    err: Error,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    this.metrics.errors++;
    this.runTimings.delete(runId);

    console.error("\n❌ [Tool Error]");
    console.error(`   Run ID: ${runId}`);
    console.error(`   Error: ${err.message}`);
  }

  /**
   * Agent 行动时触发
   */
  async handleAgentAction(
    action: AgentAction,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    console.log("\n🤖 [Agent Action]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Tool: ${action.tool}`);
    console.log(`   Input: ${action.toolInput}`);
  }

  /**
   * Agent 完成时触发
   */
  async handleAgentEnd(
    action: AgentFinish,
    runId: string,
    _parentRunId?: string
  ): Promise<void> {
    console.log("\n✅ [Agent End]");
    console.log(`   Run ID: ${runId}`);
    console.log(`   Output:`, action.returnValues);
  }

  /**
   * 获取收集的指标
   */
  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics = {
      llmCalls: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      errors: 0,
    };
    this.runTimings.clear();
  }

  /**
   * 打印指标摘要
   */
  printSummary(): void {
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                     指标摘要 (Metrics Summary)                  ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log(`  📊 LLM 调用次数: ${this.metrics.llmCalls}`);
    console.log(`  🎯 总 Token 数: ${this.metrics.totalTokens}`);
    console.log(`  📝 Prompt Tokens: ${this.metrics.promptTokens}`);
    console.log(`  💬 Completion Tokens: ${this.metrics.completionTokens}`);
    console.log(`  ❌ 错误次数: ${this.metrics.errors}`);
    if (this.metrics.duration !== undefined) {
      console.log(`  ⏱️  总耗时: ${this.metrics.duration}ms`);
    }

    // 计算成本（基于 GPT-3.5-turbo 的定价）
    const promptCost = (this.metrics.promptTokens / 1000) * 0.0015;
    const completionCost = (this.metrics.completionTokens / 1000) * 0.002;
    const totalCost = promptCost + completionCost;

    console.log(`  💰 估算成本: $${totalCost.toFixed(6)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  }
}
