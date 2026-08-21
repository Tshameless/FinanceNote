# FinanceNote - 财报与书籍深度研读笔记系统

FinanceNote 是一款专为**投资者、财务分析师及深度阅读者**设计的个人研报与读书笔记工作台。

系统整合了 **PDF 财报与书籍管理**、**精准坐标划线与笔记双向联动**、**受保护的流式阅读** 以及基于 **NestJS + PostgreSQL (pgvector) + 商用大模型 (DeepSeek / OpenAI)** 的带页码跳转 **AI 研读助手**。当前上传与解析仅支持 PDF，EPUB 暂未启用。

---

## 🌟 核心特性

1. **🔒 安全鉴权与受控文件流传输**：
   - 必须用户登录（JWT 验证）后方可读取书籍与财报资源。
   - 物理文件不暴露静态 HTTP 目录，采用 NestJS `206 Byte-Range Stream` 按需分段流式输出，防盗链与越权下载。
2. **🔐 商业大模型 API Key 绝对安全隔离**：
   - API Key 仅保存在 NestJS 后端 `.env` 环境变量中。
   - 前端零感知，S2S 内部安全传输，结合 JWT 鉴权与 Throttler 限流防刷。
3. **🤖 带有 [P42 页码出处] 引用的 AI 研读助手 (RAG)**：
   - 智能处理长篇财报与图书切块向量化，集成 PostgreSQL `pgvector` 存储 1536 维向量。
   - 支持 SSE (Server-Sent Events) 打字机流式输出，AI 回答带出处卡片，点击直接联动右侧阅读器跳转页码并绘制高亮选框。
4. **📖 双栏划线与笔记联动系统**：
   - 支持 PDF 选中文本/表格的坐标级高亮存储。
   - Markdown 笔记编辑器支持直接嵌入财报高亮锚点卡片。

---

## 🏗️ 全栈目录结构

```text
FinanceNote/
├── financenote-server/      # NestJS 8+ / 10+ 后端 API 服务
│   ├── src/
│   │   ├── config/          # 数据库与全局配置
│   │   ├── common/          # 全局 Guards, Filters, Interceptors, Decorators
│   │   └── modules/
│   │       ├── auth/        # JWT 登录认证模块
│   │       ├── user/        # 用户管理模块
│   │       ├── document/    # 文档上传、解析、受控流播放模块
│   │       ├── note/        # 笔记与划线标注模块
│   │       └── ai/          # AI RAG 向量检索与 SSE 流式输出模块
├── financenote-web/         # Vue 3 + Vite + Pinia 前端工作台
│   ├── src/
│   │   ├── api/             # Axios 请求与 SSE 流处理
│   │   ├── components/      # PDF阅读器、AI助手抽屉、Markdown编辑器
│   │   ├── views/           # 登录、大盘控制台、阅读研读主界面
│   │   └── stores/          # Pinia 全局状态
└── README.md                # 本文档
```

---

## ⚡ 快速启动指南

### 1. 环境准备
- Node.js >= 18.0.0
- PostgreSQL >= 15.0 (需安装 `pgvector` 扩展: `CREATE EXTENSION IF NOT EXISTS vector;`)

### 2. 后端启动 (financenote-server)
```bash
cd financenote-server
npm install
# 配置 .env 中的 PostgreSQL 连接、DEEPSEEK_API_KEY 和 EMBEDDING_API_KEY
# 本地首次初始化表结构（需要数据库已创建且 pgvector 可用）
npm run db:init
# 已有环境升级时执行 pgvector 与文档处理状态迁移（需要 psql 已连接到 DB_DATABASE）
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f migrations/001-enable-pgvector.sql
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f migrations/002-document-processing-state.sql
npm run start:dev
```
后端服务默认运行在 `http://localhost:3000`。

Embedding 未配置时系统仍可启动，但 AI 检索会自动回退到按页和关键词检索。配置 `EMBEDDING_API_KEY` 后，新上传文档会生成 1536 维向量并优先使用 pgvector 语义检索；已有文档需要重新处理才能补齐向量。

### 3. 前端启动 (financenote-web)
```bash
cd financenote-web
npm install
npm run dev
```
前端界面默认运行在 `http://localhost:5173`。

---

## 📄 代码注释与规范
本项目所有后端 NestJS TypeScript 代码与前端 Vue 3 组件均附带**详尽的中文注释**，涵盖：
- 架构设计思考与设计模式说明
- 函数入参、返回值与异常处理
- 安全防护与权限校验关键逻辑
