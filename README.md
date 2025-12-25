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

详细文档：[查看 README](./src/ch02/rag-faq/README.md) | [使用指南](./src/ch02/rag-faq/USAGE.md)

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
