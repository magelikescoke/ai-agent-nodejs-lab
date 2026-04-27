# Week 3 Enterprise RAG Agent 需求文档

## 目标

创建 `enterprise-rag-agent`，实现企业文档上传、异步解析、chunk、embedding、向量入库、检索问答和引用返回。目标是把 Week 1/2 的 LLM 后端工程能力迁移到 RAG 场景。

## MVP 范围

- 文档上传：支持 PDF、Markdown、TXT，限制文件大小和类型。
- 文档记录：保存文件元信息、解析状态、错误信息、chunk 数量和创建时间。
- 异步 ingestion：上传后进入队列，由 worker 解析、切块、生成 embedding、写入向量库。
- 检索接口：按 query 做 embedding，top-k 检索相关 chunk。
- 问答接口：基于检索上下文生成答案，并返回引用 chunk。
- 状态查询：客户端可以查询 ingestion job 状态。

## 非目标

- 不做完整权限系统，只预留 tenantId/userId 字段。
- 不做复杂 UI，优先完成后端 API 和可验证 curl。
- 不接多种向量库，MVP 选择一种实现。

## 技术方案

- Framework：NestJS + TypeScript。
- Queue：BullMQ + Redis。
- Storage：MongoDB 保存文档和 ingestion 状态。
- Vector store：优先 Qdrant；如果本地部署复杂，再评估 PostgreSQL + pgvector。
- Embedding provider：OpenAI-compatible embedding API，抽象 provider 接口。
- LLM provider：复用现有 OpenAI-compatible provider 结构。

## 核心模块

| Module | 职责 |
| --- | --- |
| DocumentModule | 上传文件、保存文档元数据、查询文档 |
| IngestionModule | 队列任务、解析、chunk、embedding、入库 |
| EmbeddingModule | embedding provider 抽象和批量 embedding |
| RetrievalModule | query embedding、top-k 检索、引用整理 |
| ChatModule | RAG prompt、答案生成、引用返回 |

## API 草案

| Method | Path | 说明 |
| --- | --- | --- |
| `POST` | `/documents` | 上传文档并创建 ingestion job |
| `GET` | `/documents/:id` | 查询文档元数据和解析状态 |
| `GET` | `/ingestion/jobs/:id` | 查询 ingestion job 状态 |
| `POST` | `/retrieval/search` | top-k chunk 检索 |
| `POST` | `/rag/chat` | 基于文档上下文回答问题 |

## 数据模型草案

Document:

- `id`
- `filename`
- `mimeType`
- `size`
- `status`: `uploaded | parsing | indexed | error`
- `chunkCount`
- `errorMsg`
- `createdAt`
- `updatedAt`

Chunk:

- `id`
- `documentId`
- `content`
- `chunkIndex`
- `tokenCount`
- `metadata`

## 验收标准

- 本地 Docker Compose 能启动 API、Redis、MongoDB 和向量库。
- 上传一份 Markdown/TXT 文档后能完成 ingestion。
- `POST /retrieval/search` 能返回 top-k chunk。
- `POST /rag/chat` 能返回答案和引用。
- ingestion 失败时有错误状态和可排查信息。
- README 有启动方式、API curl 和架构图。

## 风险与待确认

- PDF 解析质量和依赖选择。
- chunk 策略：按字符、token、标题层级还是混合策略。
- embedding batch 大小、重试、限流和成本控制。
- 向量库 schema 和 metadata filter 设计。
- 引用准确性 Eval 如何设计。
