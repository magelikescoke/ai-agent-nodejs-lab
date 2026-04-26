# ai-agent-nodejs-lab

AI Agent Node.js Lab 是一个用于学习和实验 AI Agent 后端工程化的 Node.js/NestJS 项目。当前首个应用是 `ai-ticket-classifier`，用于演示工单分类、LLM 结构化输出、MongoDB 持久化、测试和本地基础设施。

## 项目目标

- 搭建一个可扩展的 Node.js AI Agent 实验仓库。
- 使用 NestJS 构建可测试、可维护的后端服务。
- 为后续接入 LLM、队列、缓存、持久化和评估流程预留工程结构。
- 通过 Docker Compose 提供 MongoDB 和 Redis 本地依赖。

## 技术栈

- Node.js + npm workspaces
- NestJS
- TypeScript
- ESLint + Prettier
- Jest
- MongoDB
- Mongoose
- Redis
- Zod
- Docker Compose

## 项目结构

```text
.
├── apps/
│   └── ai-ticket-classifier/
│       ├── src/
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

## 运行方式

安装依赖：

```bash
npm install
```

启动 MongoDB 和 Redis：

```bash
npm run docker:up
```

启动 NestJS 开发服务：

```bash
npm run start:dev
```

健康检查：

```bash
curl http://localhost:3000/health
```

工单分类示例：

```bash
curl -X POST http://localhost:3000/tickets/analyze \
  -H 'Content-Type: application/json' \
  -d '{"content":"I was charged twice for the same subscription."}'
```

`POST /tickets/analyze` 会调用默认 LLM Provider 生成结构化 JSON，并将请求内容、分类结果和处理状态写入 MongoDB。

## 常用命令

```bash
npm run build
npm run lint
npm run format
npm run test
npm run docker:down
```

## 环境变量

复制示例配置后按需调整：

```bash
cp apps/ai-ticket-classifier/.env.example apps/ai-ticket-classifier/.env
```

当前支持的环境变量：

| 变量             | 默认值                                                                         | 说明                           |
| ---------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| `PORT`           | `3000`                                                                         | API 服务端口                   |
| `MONGODB_URI`    | `mongodb://root:example@localhost:27017/ai_ticket_classifier?authSource=admin` | MongoDB 连接地址               |
| `REDIS_URL`      | `redis://localhost:6379`                                                       | Redis 连接地址                 |
| `GLM_MODEL`      | `GLM-4.7-Flash`                                                                | GLM 默认模型                   |
| `GLM_API_KEY`    | 空                                                                             | GLM API Key                    |
| `GLM_BASE_URL`   | `https://open.bigmodel.cn/api/paas/v4`                                         | GLM OpenAI-compatible Base URL |
| `GLM_TIMEOUT_MS` | `30000`                                                                        | GLM 请求超时时间               |
