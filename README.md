# AI Agent Node.js Lab

AI Agent Node.js Lab 是一个用于学习和实验 AI Agent 后端工程化的 Node.js/NestJS 项目。当前应用 `ai-ticket-classifier` 是一个 AI 工单分类与结构化输出系统，用来演示 LLM API 接入、结构化 JSON 输出、Zod 校验、MongoDB 持久化、Redis 缓存、BullMQ 批量任务和基础评测样例。

## Week 1 MVP

- `POST /tickets/analyze`：同步分析单条工单，返回受控 JSON。
- `POST /tickets/batch-analyze`：批量提交工单，每条工单进入 BullMQ job。
- `GET /tickets/:id`：查询 MongoDB 中的分析记录。
- `GET /jobs/:id`：查询 BullMQ job 状态、进度、失败原因和结果。
- LLM 输出使用 JSON Schema + Zod 双层约束，校验失败自动 retry 1 次。
- 相同工单内容使用 SHA-256 做缓存 key，命中 Redis 后跳过 LLM 调用。
- API 层有简单 IP rate limit，Worker 层通过 BullMQ 控制并发和频率。

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

## 架构

```mermaid
flowchart LR
  Client[Client] --> API[NestJS API]
  API --> RateLimit[API Rate Limit]
  RateLimit --> Cache{Redis Cache}
  Cache -- hit --> API
  Cache -- miss --> Queue[BullMQ Queue]
  Queue --> Worker[Ticket Worker]
  Worker --> LLM[LLM Provider]
  LLM --> Schema[JSON Schema + Zod]
  Schema --> Mongo[(MongoDB)]
  Schema --> Cache
  Mongo --> API
  Queue --> JobStatus[GET /jobs/:id]
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

## API

| Method | Path                     | 说明                       |
| ------ | ------------------------ | -------------------------- |
| `GET`  | `/health`                | 服务健康检查               |
| `GET`  | `/llm/health`            | LLM Provider 健康检查      |
| `POST` | `/llm/generate/text`     | 调试用文本生成接口         |
| `POST` | `/tickets/analyze`       | 同步分析单条工单           |
| `GET`  | `/tickets/analyze/stream` | SSE 流式分析单条工单       |
| `GET`  | `/tickets/:id`           | 查询工单分析记录           |
| `POST` | `/tickets/batch-analyze` | 批量提交异步分析任务       |
| `GET`  | `/jobs/:id`              | 查询异步任务状态与处理结果 |

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
