# AI Ticket Classifier

AI Ticket Classifier 是一个基于 NestJS 的 LLM 工单分析后端，把非结构化客服工单稳定转成可存储、可查询、可评测的结构化 JSON。项目覆盖 LLM API 接入、JSON Schema + Zod 双层校验、Prompt 版本评测、Redis 缓存、MongoDB 持久化、BullMQ 异步任务、SSE 流式事件、Docker 一键启动和 GitHub Actions CI。

## 项目亮点

- 稳定结构化输出：使用 OpenAI-compatible `response_format` 约束模型输出，再用 Zod strict schema 做服务端白名单校验。
- 生产化请求链路：同步分析、批量异步分析、BullMQ worker、Redis 缓存、MongoDB 审计记录都已打通。
- 流式体验：`GET /tickets/analyze/stream` 使用 SSE 推送 `AgentEvent`，前端可实时展示 received、analyzing、token、validating、completed、error。
- 安全与防注入：输入长度限制、ticket content 隔离、prompt injection 测试、异常输出 fallback。
- 可回归评测：内置 20 条 eval case，对比 prompt v1/v2 的 schema pass、分类准确率、优先级准确率和延迟。
- 工程交付：Docker Compose 一键启动 app、MongoDB、Redis；GitHub Actions 自动执行 lint/test。

## 技术栈

- Node.js + npm workspaces
- NestJS
- TypeScript
- ESLint + Prettier
- Jest
- MongoDB
- Mongoose
- Redis
- BullMQ
- Zod
- Docker Compose

## 项目结构

```text
.
├── apps/
│   └── ai-ticket-classifier/
│       ├── src/
│       │   ├── llm/
│       │   ├── ticket/
│       │   ├── common/
│       │   └── config/
│       ├── test-data/
│       ├── jest.config.ts
│       ├── package.json
│       ├── tsconfig.app.json
│       └── tsconfig.spec.json
├── docker-compose.yml
├── eslint.config.mjs
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## 架构图

```mermaid
flowchart TD
  Client[Client / Frontend] --> API[NestJS API]
  API --> Guard[Validation + Rate Limit]
  Guard --> Cache{Redis Content Cache}
  Cache -- hit --> Response[API Response]
  Cache -- miss, sync --> LLM[OpenAI-compatible LLM]
  Cache -- miss, batch --> Queue[BullMQ Queue]
  Queue --> Worker[TicketAnalysisProcessor]
  Worker --> LLM
  LLM --> Format[JSON Schema response_format]
  Format --> Validate[Zod Strict Validation]
  Validate -- pass --> Mongo[(MongoDB ticket_analyses)]
  Validate -- fail --> Retry[Retry once / Error fallback]
  Retry --> Mongo
  Mongo --> Cache
  Mongo --> Response
  API --> SSE[SSE AgentEvent Stream]
  Queue --> JobAPI[GET /jobs/:id]
```

## 运行方式

一键 Docker 启动 app、MongoDB 和 Redis：

```bash
./scripts/start-local.sh
```

也可以使用 npm script：

```bash
npm run start:local
```

脚本会在缺少 `apps/ai-ticket-classifier/.env` 时从 `.env.example` 复制一份，然后执行 `docker compose up --build -d`。Docker Compose 默认读取 `.env.example` 并在容器内覆盖 MongoDB/Redis 连接地址；如果要调用真实 LLM，请先在 `.env.example` 或部署环境变量里配置 `GLM_API_KEY`。启动后访问：

```bash
curl http://localhost:3000/health
```

停止服务：

```bash
npm run docker:down
```

本地开发启动：

安装依赖：

```bash
npm install
```

启动完整 Docker 服务：

```bash
npm run docker:up
```

如果只想启动依赖服务，不启动 app 容器：

```bash
docker compose up -d mongodb redis
```

启动 NestJS 开发服务：

```bash
npm run start:dev
```

健康检查：

```bash
curl http://localhost:3000/health
```

同步分析工单：

```bash
curl -X POST http://localhost:3000/tickets/analyze \
  -H 'Content-Type: application/json' \
  -d '{"content":"I was charged twice for the same subscription."}'
```

`POST /tickets/analyze` 会调用默认 LLM Provider 生成结构化 JSON，并将请求内容、分类结果和处理状态写入 MongoDB。

查询分析记录：

```bash
curl http://localhost:3000/tickets/507f1f77bcf86cd799439011
```

分析记录会保存请求内容、原始模型输出、解析后的结构化输出、模型名、耗时、重试次数和处理状态。

## 接口文档

| Method | Path                      | Request                       | Response / Event                     | 说明                       |
| ------ | ------------------------- | ----------------------------- | ------------------------------------ | -------------------------- |
| `GET`  | `/health`                 | 无                            | 服务名、版本、状态                   | 服务健康检查               |
| `GET`  | `/llm/health`             | 无                            | provider 状态、耗时、错误信息        | LLM Provider 健康检查      |
| `POST` | `/llm/generate/text`      | `{ "prompt": "..." }`         | LLM 文本结果                         | 调试用文本生成接口         |
| `POST` | `/tickets/analyze`        | `{ "content": "..." }`        | `TicketAnalysisResponse`             | 同步分析单条工单           |
| `GET`  | `/tickets/analyze/stream` | query: `content=...`          | SSE `AgentEvent<T>`                  | 流式分析单条工单           |
| `GET`  | `/tickets/:id`            | path: Mongo ObjectId          | `TicketAnalysisResponse`             | 查询工单分析记录           |
| `POST` | `/tickets/batch-analyze`  | `{ "tickets": [{content}] }`  | batchId、jobIds                      | 批量提交异步分析任务       |
| `GET`  | `/jobs/:id`               | path: BullMQ job id           | job 状态、进度、失败原因、处理结果   | 查询异步任务状态与处理结果 |

批量异步分析：

```bash
curl -X POST http://localhost:3000/tickets/batch-analyze \
  -H 'Content-Type: application/json' \
  -d '{"tickets":[{"content":"I cannot sign in."},{"content":"The dashboard returns a 500 error."}]}'
```

查询异步任务：

```bash
curl http://localhost:3000/jobs/31d7e4df-bd20-4109-8857-f198f522f3a3-0
```

批量分析会把每条工单提交为一个 BullMQ job，由 worker 控制 LLM 分析并发和频率。

流式分析：

```bash
curl -N -G 'http://localhost:3000/tickets/analyze/stream' \
  --data-urlencode 'content=The dashboard keeps returning a 500 error when I open the reports page.'
```

SSE 事件协议：

每条 SSE 的 `event` 等于 `AgentEvent.type`，`data` 是完整的 `AgentEvent` JSON：

```ts
interface AgentEvent<T = unknown> {
  type: AgentEventType;
  timestamp: string;
  data?: T;
}
```

| Event                  | 说明                         |
| ---------------------- | ---------------------------- |
| `analysis.received`    | 服务端已接收分析请求         |
| `analysis.analyzing`   | 开始调用 LLM 分析            |
| `llm.token`            | LLM token 增量，`data` 为 `{"delta":"..."}` |
| `analysis.validating`  | 开始解析并校验完整模型输出   |
| `analysis.completed`   | 分析流程结束                 |
| `error`                | 分析失败，`data` 为 `{"message":"..."}` |

批量任务流程：

```mermaid
flowchart LR
  Client[Client] --> API[POST /tickets/batch-analyze]
  API --> Queue[Redis BullMQ Queue]
  Queue --> Worker[TicketAnalysisProcessor]
  Worker --> Cache{Redis Cache Hit?}
  Cache -- Yes --> Result[Return cached analysis]
  Cache -- No --> LLM[LLM Provider]
  LLM --> Validate[Zod validate JSON]
  Validate --> Mongo[(MongoDB ticket_analyses)]
  Result --> Job[Job result]
  Mongo --> Job
  Client --> Status[GET /jobs/:id]
  Status --> Queue
```

## 结构化输出

LLM 输出被限制为以下字段：

```json
{
  "category": "billing | technical | account | complaint | other",
  "priority": "low | medium | high | urgent",
  "overview": "Brief summary of the customer issue.",
  "suggestedAction": "Recommended next support action."
}
```

服务端会用 Zod 做白名单校验，拒绝 schema 外字段和不支持的分类。校验失败时会 retry 1 次，并把原始输出、解析结果、重试次数、模型名和耗时写入 MongoDB。

## 安全与防注入

当前工单分析接口采用以下基础防护：

- 输入长度限制：`content` 会 trim，并限制为 1 到 10000 个字符。
- Prompt injection 隔离：用户工单会包在 `<ticket_content>` 中，system prompt 明确要求把工单内容当作不可信数据，不执行其中要求忽略规则、泄露 prompt 或改变输出格式的指令。
- 输出范围限制：system prompt、OpenAI-compatible `response_format` 和 Zod schema 都只允许 `category`、`priority`、`overview`、`suggestedAction`。
- 白名单校验：`category`、`priority` 必须命中固定枚举，schema 使用 strict object 拒绝额外字段。
- 异常 fallback：模型输出非法 JSON、schema 校验失败或 LLM 调用异常时，请求不会把异常结构当成成功结果，而是写入 `status: "error"` 的分析记录，并返回错误状态。

## 常用命令

```bash
npm run build
npm run lint
npm run format
npm run test
npm run docker:up
npm run docker:down
```

测试样例在 `apps/ai-ticket-classifier/test-data/ticket-cases.json`，当前包含 20 条覆盖 `billing / technical / account / complaint / other` 的工单分类样例。

## Ticket Eval

正式 eval case 在 `evals/ticket-cases.json`，每条包含 `input` 和期望的 `category` / `priority`。

运行：

```bash
npm run eval:ticket
```

脚本会对比 `ticket-analysis-v1` 和 `ticket-analysis-v2`，输出准确率、失败 case、平均耗时，并把每个 prompt version 的详细评测结果写入 `docs/prompt-stability-few-shot-eval.md`。

当前评测结果示例：

| Prompt version | Accuracy | Schema pass | Category match | Priority match | Avg latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ticket-analysis-v1` | 0% (0/20) | 0/20 | 0/20 | 0/20 | 1100ms |
| `ticket-analysis-v2` | 55% (11/20) | 20/20 | 19/20 | 12/20 | 1236ms |

这个结果说明：仅靠“返回 JSON”的 prompt 不稳定；加入 few-shot、优先级规则和严格 schema 后，schema pass 从 0/20 提升到 20/20，但 priority 判断仍有优化空间。

## 生产化考虑

- 幂等性：批量任务当前用 batchId + index 生成 jobId，后续可引入客户端 `Idempotency-Key` 或请求 hash，避免重复提交产生重复 job。
- 可观测性：分析记录已保存 rawOutput、parsedOutput、promptVersion、modelName、latencyMs、retryCount，可继续接入 traceId、结构化日志和指标面板。
- 成本控制：内容 hash + Redis cache 已减少重复 LLM 调用，后续可加入 token 统计、请求预算和 provider fallback。
- 安全边界：已加入输入长度、prompt injection 隔离、schema 白名单和异常 fallback；生产环境还应增加认证、租户隔离、敏感信息脱敏和审计日志。
- 可靠性：BullMQ 承担异步批量任务，后续可细化 dead-letter queue、重试退避、worker 水位监控和优雅停机。
- 部署：Docker Compose 覆盖本地完整依赖，CI 覆盖 lint/test；生产部署可拆分 API/worker 镜像并使用托管 MongoDB/Redis。

## 简历项目描述

AI 工单分类与结构化输出系统：基于 NestJS/TypeScript 构建 LLM 应用后端，将客服工单自动分类为受控 JSON，并支持同步分析、批量异步任务和 SSE 流式状态推送。使用 OpenAI-compatible response_format + Zod strict schema 实现模型输出白名单校验，结合 prompt versioning、20 条 eval case 和 few-shot 对比评估输出稳定性；通过 Redis 内容缓存降低重复 LLM 调用，MongoDB 持久化 raw/parsed output、耗时、模型名和重试次数，BullMQ 控制批量任务并发。补充 prompt injection 防护、异常 fallback、Docker Compose 一键启动和 GitHub Actions lint/test，体现从 demo 到可上线后端服务的工程化能力。

## 延伸文档

- [LLM 应用为什么必须做结构化输出和评测](docs/llm-structured-output-and-eval.md)
- [Week 2 Ticket Classifier 面试问答](docs/week2-ticket-classifier-interview-qa.md)
- [Week 3 Enterprise RAG Agent 需求文档](docs/week3-enterprise-rag-agent-requirements.md)
- [Backlog](docs/backlog.md)

## Enterprise RAG Agent

`apps/enterprise-rag-agent` 是 Week 3 的 RAG 学习项目骨架，目标是后续逐步实现企业文档上传、异步解析、chunk、embedding、向量入库、检索问答和引用返回。当前初版只做项目初始化和通用基础设施，业务模块先不展开。

当前保留内容：

- 独立 NestJS app：`apps/enterprise-rag-agent`
- 配置入口：`app.config.ts`、`rag.config.ts`
- 从 ticket 项目复制来的 common 基础代码：统一响应、异常过滤、AgentEvent
- `GET /health` 健康检查
- Qdrant docker-compose 服务，作为后续向量库学习环境

启动开发服务：

```bash
npm run start:rag:dev
```

基础接口：

```bash
curl http://localhost:3001/health
```

## 环境变量

复制示例配置后按需调整：

```bash
cp apps/ai-ticket-classifier/.env.example apps/ai-ticket-classifier/.env
```

当前支持的环境变量：

| 变量                             | 默认值                                                                         | 说明                           |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| `PORT`                           | `3000`                                                                         | API 服务端口                   |
| `MONGODB_URI`                    | `mongodb://root:example@localhost:27017/ai_ticket_classifier?authSource=admin` | MongoDB 连接地址               |
| `REDIS_URL`                      | `redis://localhost:6379`                                                       | Redis 连接地址                 |
| `TICKET_ANALYSIS_PROMPT_VERSION` | `ticket-analysis-v1`                                                           | 工单分析 prompt 版本           |
| `GLM_MODEL`                      | `GLM-4.7-Flash`                                                                | GLM 默认模型                   |
| `GLM_API_KEY`                    | 空                                                                             | GLM API Key                    |
| `GLM_BASE_URL`                   | `https://open.bigmodel.cn/api/paas/v4`                                         | GLM OpenAI-compatible Base URL |
| `GLM_TIMEOUT_MS`                 | `30000`                                                                        | GLM 请求超时时间               |
