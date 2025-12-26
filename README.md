# LangChain.js 教程项目

LangChain.js 学习和实战项目集合。

## 📚 项目列表

### 基础教程

- `basic-chat.ts` - 基础对话
- `prompt-template.ts` - Prompt 模板
- `streaming-response.ts` - 流式响应
- `basic-instruction.ts` - 基础指令
- `chat-prompt.ts` - 聊天 Prompt
- `few-shot.ts` - Few-shot 学习
- `pipeline.ts` - 管道处理
- `outparser.ts` - 输出解析
- `zod.ts` - Zod 结构化输出
- `runnable-compose.ts` - Runnable 组合
- `memory-window.ts` - 对话记忆窗口
- `callbacks.ts` - 回调函数

### 实战项目

#### 📖 [Ch02: FAQ RAG Chat](./src/ch02/rag-faq/README.md)

基于 Prompt 的 FAQ 智能问答系统，实现结构化答案、来源引用和低幻觉。

**特性**：
- ✅ 结构化 JSON 输出
- ✅ 来源引用和溯源
- ✅ 置信度评分
- ✅ 防幻觉护栏
- ✅ 30+ 问题测试集

**快速开始**：

```bash
# 配置 API Key
echo "OPENAI_API_KEY=your-key" > .env

# 运行示例
npm run rag-faq

# 测试单个问题
npm run rag-faq:test "什么是 LangChain.js？"

# 批量测试
npm run rag-faq:batch
```

详细文档：[查看 README](./src/ch02/rag-faq/README.md)

#### 🧠 [Ch03: Memory 系统与对话状态管理](./src/ch03/README.md)

系统理解 LangChain.js 的 Memory 体系，掌握短期/长期/摘要/向量记忆等多种方案。

**特性**：
- ✅ MessagesPlaceholder 注入历史对话
- ✅ Buffer/Window/Summary/Vector 多种记忆方案
- ✅ Redis/MongoDB 持久化
- ✅ 多用户会话管理
- ✅ 个性化学习助手

**快速开始**：

```bash
# 基础示例
npm run memory:basic-placeholder
npm run memory:window-buffer
npm run memory:summary

# 实战项目
npm run memory:multi-session
npm run memory:learning-assistant
```

详细文档：[查看 README](./src/ch03/README.md)

#### 📡 [Ch04: Callback 机制与事件驱动架构](./src/ch04/README.md)

全面掌握 LangChain.js 的 Callback 体系，实现流式输出、进度上报、链路追踪与实时监控。

**特性**：
- ✅ 自定义 CallbackHandler（指标收集）
- ✅ 流式输出（打字机效果）
- ✅ 取消和超时控制
- ✅ Runnable 回调融合（链路追踪）
- ✅ 实时聊天系统

**快速开始**：

```bash
# 基础示例
npm run callback:console
npm run callback:metrics
npm run callback:stream

# 实战项目
npm run callback:realtime-chat
```

详细文档：[查看 README](./src/ch04/README.md)

#### 🔧 [Ch05: Runnable 接口与任务编排系统](./src/ch05/README.md)

掌握 LangChain.js 的 Runnable 抽象，构建可组合、可复用、可测试的智能工作流。

**特性**：
- ✅ RunnableLambda/Sequence/Parallel
- ✅ 顺序流水线、条件分支、扇出/汇聚
- ✅ 流式处理、批量处理
- ✅ 错误处理、重试机制
- ✅ 内容处理流水线、RAG ETL

**快速开始**：

```bash
# 核心概念
npm run runnable:sequence
npm run runnable:lambda
npm run runnable:parallel
```

详细文档：[查看 README](./src/ch05/README.md)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
OPENAI_API_KEY=your-api-key-here
```

### 3. 运行示例

```bash
# 运行基础示例
npm run basic-chat
npm run prompt-template

# 运行 FAQ RAG 项目
npm run rag-faq
```

## 📦 技术栈

- **框架**: LangChain.js
- **运行时**: Node.js 20+
- **语言**: TypeScript
- **包管理**: npm
- **LLM**: OpenAI GPT-3.5/GPT-4

## 📖 学习资源

- [LangChain.js 官方文档](https://js.langchain.com/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC
