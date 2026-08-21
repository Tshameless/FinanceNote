# FinanceNote 架构设计与安全防护说明文档

本文档针对 FinanceNote 系统中的**用户身份鉴权、受保护资源流输出、商用 LLM API Key 防泄露以及 RAG 向量问答**进行了系统化的详细说明。

---

## 1. 架构总览与交互拓扑

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Vue 3 前端客户端 (Web SPA)                       │
│  - JWT Auth Guard                 - PDF.js Canvas 渐进式渲染           │
│  - AI Copilot 打字机 (Fetch SSE)   - Markdown 财报划线锚点编辑器        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               HTTP REST / SSE Stream / 206 Range Stream (Authorization Header)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        NestJS 后端 API 服务 (3000 端口)                 │
│  - Passport JWT AuthGuard (拦截未登录与越权读取)                          │
│  - DocumentStreamController (以 206 Stream 输出物理 PDF/EPUB)            │
│  - DocumentService (后台按页切块 600字 + 提取页码元数据)                  │
│  - AiService (读取 process.env.DEEPSEEK_API_KEY，后发 S2S 请求)          │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│  PostgreSQL (pgvector 扩展)  │          │  商用大模型 API (DeepSeek/   │
│  - users & documents & notes │          │  OpenAI / 通义千问)           │
│  - document_chunks (向量列)  │          │  (仅通过 S2S 内部安全调用)     │
└──────────────────────────────┘          └──────────────────────────────┘
```

---

## 2. API Key 与受控资源安全防护三重保障

### 2.1 屏障一：API Key 绝对隔离在后端 (`.env`)
- **零触碰**：前端 Vue 3 不保存、不处理也不下发任何大模型的 API Key。
- **S2S 安全通信**：NestJS 后端通过 `process.env.DEEPSEEK_API_KEY` 在服务器端内部网络发起 HTTP POST 请求，捕获大模型返回的 token 流后再转发回前端。
- **版本控制隔离**：`.env` 已列入 `.gitignore`，防止误提交到代码库。

### 2.2 屏障二：必须登录才能读取书籍与财报资源
- **禁用静态公开目录**：后端不挂载静态文件夹路由（避免通过固定 URL 直接爆破下载 PDF/EPUB）。
- **受受控控制器 (`DocumentStreamController`)**：所有书籍与财报的流播放接口为 `GET /api/documents/:id/stream`，强制经过 `JwtAuthGuard` 校验。
- **物理所有权校验**：系统自动校验当前 Token 对应的 `userId` 是否为该文件的所有者或管理员，非授权请求直接返回 `403 Forbidden`。

### 2.3 屏障三：支持分片渐进式加载 (HTTP 206 Range Stream)
- 当用户在 Vue 3 中打开大体积财报 PDF (如 300 页 50MB) 时，前端 PDF.js 发送带 `Range: bytes=0-65535` 的 Header。
- NestJS 使用 Node.js 原生 `fs.createReadStream(path, { start, end })` 以 **HTTP 206 Partial Content** 传输切片，既保证文件安全又极大加快渲染速度。

---

## 3. RAG 向量解析与 [P42 页码出处] 联动机制

1. **结构化提取**：在后台解析 PDF 时，记录每个文本块所在的 `pageNumber`（页码）。
2. **向量写入**：把包含 `[第 X 页]` 出处的文本片段计算 1536 维 Embedding，写入 `document_chunks` 表。
3. **出处优先推送**：RAG 检索匹配最相似的 Top-K 块后，NestJS 先通过 SSE 推送 `sources: [{ pageNumber: 42 }]` 数组，在前端对话框中呈现为高亮标签卡片。
4. **一键驱动跳页**：用户点击出处标签时，通过 Vue 组件通信通知 `pdfjsLib` 跳转至对应 `pageNumber`，并在对应逻辑区域绘制闪烁选框。

---

## 4. 数据库实体定义 (ERD Overview)

- **`users`**：`id`, `username`, `email`, `passwordHash`, `createdAt`
- **`documents`**：`id`, `userId`, `isPublic`, `title`, `docType` (FINANCIAL_REPORT/BOOK), `fileFormat`, `filePath`, `status`
- **`document_chunks`**：`id`, `docId`, `pageNumber`, `content`, `metadata`, `embedding` (vector)
- **`notes`**：`id`, `userId`, `docId`, `title`, `content`, `tags`
- **`annotations`**：`id`, `userId`, `docId`, `noteId`, `pageNum`, `rectCoords`, `selectedText`, `color`
