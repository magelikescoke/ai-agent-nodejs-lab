# Node.js 后端转 AI Agent 开发：每日 TODO 计划

> 适用对象：王鑫龙，3 年+ Node.js 后端开发经验，熟悉 TypeScript / NestJS / MongoDB / Redis / BullMQ / Kafka / WebSocket / Docker，目标：找 AI Agent 应用开发 / LLM 应用后端 / AI Backend Engineer 岗位。

## 0. 总目标

在 10 周内完成 3 个可展示项目、1 套面试材料、1 份 AI Agent 方向简历改造稿。

最终作品集：

- [ ] `ai-ticket-classifier`：AI 工单分类与结构化输出系统
- [ ] `enterprise-rag-agent`：企业知识库 RAG Agent
- [ ] `ai-ops-agent`：运维自动化 Agent，包含 Tool Calling、Workflow、Human-in-the-loop、WebSocket 实时执行状态
- [ ] `nestjs-mcp-server`：MCP Server，把内部工具标准化暴露给 Agent
- [ ] `agent-eval-suite`：Agent / RAG / Tool Calling 评测脚本
- [ ] AI Agent 方向简历一版
- [ ] 6 篇技术文章 / README 长文
- [ ] 50 道面试题复盘

---

## 1. 你的求职定位

### 推荐投递岗位

- AI Agent Developer
- LLM Application Engineer
- AI Backend Engineer
- RAG Engineer
- Agent Workflow Engineer
- AI SaaS 后端工程师
- Node.js AI Application Engineer

### 你的差异化卖点

你不应该包装成算法工程师，而应该包装成：

> 具备复杂后端工程经验的 AI Agent 应用开发工程师，能把 LLM、RAG、工具调用、异步任务编排、WebSocket 实时状态、队列系统和业务系统集成成可上线的 Agent 产品。

### 简历关键词迁移

| 你已有经历               | 转成 AI Agent 卖点                        |
| ------------------------ | ----------------------------------------- |
| 数字人视频生成全链路后端 | 长任务 AI Workflow / 异步任务编排         |
| 自研异步流程控制工具     | Agent Workflow Engine / 多步骤任务状态机  |
| WebSocket 行情实时推送   | Agent 执行过程实时推送 / Streaming UX     |
| Bull / Kafka / RabbitMQ  | Agent 后台任务、工具执行、任务恢复        |
| Redis 分布式锁 / Redlock | Agent 并发控制、幂等和审批锁              |
| 支付一致性 / 延迟队列    | Agent 工具调用可靠性、补偿机制            |
| 数据源适配层 / 工厂模式  | Agent Tool Adapter / MCP Tool Adapter     |
| 文档与 Proto 定义        | Tool Schema / API Contract / MCP 协议设计 |

---

## 2. 每天固定节奏

每天 4 小时，建议固定结构：

- [ ] 30 分钟：读官方文档 / 示例代码
- [ ] 2 小时：写项目功能
- [ ] 45 分钟：测试、日志、错误处理、README
- [ ] 30 分钟：Python / AI 基础 / Eval 脚本
- [ ] 15 分钟：写当天复盘，提交 Git commit

每日最低完成标准：

- [x] 至少 1 次有效 Git commit
- [x] 至少完成 1 个可运行功能或 1 个明确修复
- [x] README / TODO / 技术笔记至少更新 5 行
- [ ] 记录当天遇到的 1 个问题和解决方案

---

# 10 周每日计划

## Week 1：LLM API + 结构化输出基础

目标：完成 `ai-ticket-classifier` 的最小可运行版本。

### Day 1：项目初始化与技术选型

- [x] 创建 GitHub 仓库：`ai-agent-nodejs-lab`
- [x] 初始化 monorepo 或单仓库结构
- [x] 初始化 NestJS 项目：`apps/ai-ticket-classifier`
- [x] 配置 TypeScript、ESLint、Prettier、Jest
- [x] 配置 Docker Compose：MongoDB、Redis
- [x] 写 README：项目目标、技术栈、运行方式
- [x] 学习：LLM API 基本概念，messages、system prompt、temperature、tokens
- [ ] Python 30 分钟：安装 uv 或 venv，写第一个 Python 脚本

验收：`npm run start:dev` 可以启动，`docker compose up` 可运行依赖。

### Day 2：接入 LLM Provider

- [x] 封装 `LlmModule`
- [x] 实现 `LlmService.generateText()`
- [x] 支持环境变量配置 model、apiKey、baseURL
- [x] 加入 timeout、基础错误处理
- [x] 写一个 `/llm/health` 测试接口
- [x] 记录每次请求耗时
- [x] README 增加环境变量说明
- [ ] Python 30 分钟：学习 list、dict、函数

验收：通过 API 能拿到模型返回文本。

### Day 3：结构化输出与 Zod Schema

- [x] 定义 `TicketAnalysisSchema`
- [x] 设计工单分类枚举：billing / technical / account / complaint / other
- [x] 实现 `analyzeTicket()`，要求模型输出 JSON
- [x] 使用 Zod 校验模型输出
- [x] 校验失败时自动 retry 1 次
- [x] 记录原始输出和解析后输出
- [x] 准备 10 条测试工单
- [ ] Python 30 分钟：学习类型标注和 pydantic 基础概念

验收：输入工单文本，稳定返回合法 JSON。

### Day 4：NestJS API 与 MongoDB 持久化

- [x] 创建 `TicketModule`
- [x] 实现 `POST /tickets/analyze`
- [x] 保存请求、输出、模型名、耗时、状态到 MongoDB
- [x] 实现 `GET /tickets/:id`
- [x] 加入 DTO 校验
- [x] 加入异常过滤器
- [x] README 增加 API 示例
- [ ] Python 30 分钟：读取 JSON 文件并打印统计

验收：一次分析请求能完整落库并查询。

### Day 5：Redis 缓存与幂等

- [x] 接入 Redis
- [ ] 对相同 ticket content 做 hash
- [ ] 命中缓存时不再调用 LLM
- [ ] 缓存返回标记 `cacheHit: true`
- [x] 设计缓存 TTL
- [ ] 加入简单 rate limit
- [ ] 写 Jest 单测覆盖 hash 与缓存逻辑
- [ ] Python 30 分钟：写一个 CSV/JSON 转换脚本

验收：重复请求能命中缓存，节省 LLM 调用。

### Day 6：BullMQ 批量任务

- [ ] 接入 BullMQ
- [ ] 实现 `POST /tickets/batch-analyze`
- [ ] 实现 `GET /jobs/:id`
- [ ] 每个工单作为 job 或 batch 子任务执行
- [ ] job 失败时记录原因
- [ ] 支持重试策略
- [ ] README 增加批量任务流程图
- [ ] Python 30 分钟：学习 argparse，写命令行脚本雏形

验收：批量提交 20 条工单，能异步处理并查询状态。

### Day 7：周复盘与小型发布

- [ ] 整理 Week 1 README
- [ ] 增加架构图：API -> Queue -> LLM -> MongoDB -> Redis
- [ ] 补 20 条测试样例
- [ ] 写 1 篇短文：`我如何用 NestJS 做稳定的 LLM 结构化输出`
- [ ] Review 代码，删除临时代码
- [ ] 打 tag：`week1-ticket-classifier-mvp`
- [ ] 整理 5 道面试题：structured output、retry、缓存、幂等、token 成本

验收：项目可以给别人 clone 后跑起来。

---

## Week 2：把工单系统做成“工程化 AI 后端项目”

目标：补齐日志、评测、prompt version、可观测性，让它像真实项目。

### Day 8：Prompt Version 管理

- [ ] 把 prompt 从代码中抽离到 `prompts/`
- [ ] 增加 `promptVersion`
- [ ] MongoDB 记录 prompt version
- [ ] 支持通过配置切换 prompt
- [ ] 增加 few-shot 示例
- [ ] 测试不同 prompt 对输出稳定性的影响
- [ ] Python 30 分钟：读取多个 JSON case 并批量执行

验收：每次输出都能追溯使用了哪个 prompt。

### Day 9：结果评测 v1

- [ ] 建立 `evals/ticket-cases.json`
- [ ] 每条 case 包含 input 和 expected category / priority
- [ ] 写 `npm run eval:ticket`
- [ ] 输出准确率、失败 case、平均耗时
- [ ] 记录每个 prompt version 的评测结果
- [ ] README 增加 eval 使用方式
- [ ] Python 30 分钟：用 Python 统计 eval 结果

验收：改 prompt 后可以跑回归测试。

### Day 10：流式响应与 SSE / WebSocket 预研

- [ ] 实现 SSE 或 WebSocket 的基础连接
- [ ] 分析请求时推送状态：received / analyzing / validating / completed
- [ ] 如果模型支持 streaming，尝试透传 token 流
- [ ] 记录前端可消费的事件格式
- [ ] 设计 Agent 执行事件标准：`AgentEvent`
- [ ] README 增加事件协议
- [ ] Python 30 分钟：学习 generator 概念

验收：客户端能实时看到分析状态。

### Day 11：安全与防注入基础

- [ ] 增加输入长度限制
- [ ] 增加 prompt injection 测试样例
- [ ] 在 system prompt 里限制输出范围
- [ ] 对模型输出做白名单校验
- [ ] 对异常输出做 fallback
- [ ] 增加安全章节 README
- [ ] Python 30 分钟：学习正则与文本清洗

验收：恶意输入不能让系统输出 schema 外字段或泄露 prompt。

### Day 12：Docker 化与 CI

- [ ] 完善 Dockerfile
- [ ] 完善 docker-compose：app、mongo、redis
- [ ] 增加 `.env.example`
- [ ] 增加 GitHub Actions：lint、test
- [ ] 补充启动文档
- [ ] 写一键启动脚本
- [ ] Python 30 分钟：学习 requests，调用本地 API

验收：新机器按 README 能 10 分钟内跑通。

### Day 13：项目包装成求职作品

- [ ] README 顶部写清楚项目亮点
- [ ] 增加接口文档表格
- [ ] 增加架构图
- [ ] 增加 Eval 截图或结果示例
- [ ] 增加“生产化考虑”章节
- [ ] 整理简历项目描述第一版
- [ ] Python 30 分钟：整理 eval 输出为 markdown 表格

验收：README 看起来像可投递项目，不像练习 demo。

### Day 14：Week 2 复盘

- [ ] 录制或截图项目运行效果
- [ ] 打 tag：`week2-ticket-classifier-production-ready`
- [ ] 写技术文章：`LLM 应用为什么必须做结构化输出和评测`
- [ ] 总结 10 个面试问答
- [ ] 整理 Week 3 RAG 项目需求文档
- [ ] 清理 issue，把未完成项转入 backlog

验收：第一个作品可以放进简历。

---

## Week 3：RAG 文档解析与索引管线

目标：启动 `enterprise-rag-agent`，完成文档上传、异步解析、chunk、embedding、向量入库。

### Day 15：RAG 项目初始化

- [ ] 新建 `apps/enterprise-rag-agent`
- [ ] 设计模块：Document / Ingestion / Embedding / Retrieval / Chat
- [ ] 配置 PostgreSQL + pgvector 或 Qdrant
- [ ] Docker Compose 增加向量库
- [ ] 设计文档元数据 schema
- [ ] README 写 RAG 系统目标
- [ ] Python 30 分钟：学习 numpy 基础概念

验收：RAG 服务启动，数据库可连接。

### Day 16：文件上传与文档存储

- [ ] 实现 `POST /documents/upload`
- [ ] 支持 txt / md，PDF 可先预留
- [ ] 保存文件元数据到 MongoDB 或 PostgreSQL
- [ ] 文件本体存本地目录或 MinIO
- [ ] 上传后创建 BullMQ ingestion job
- [ ] 实现 `GET /documents/:id`
- [ ] Python 30 分钟：读取文本文件并切分

验收：上传文档后能生成待处理任务。

### Day 17：Chunking 策略

- [ ] 实现 recursive chunking
- [ ] 支持 chunkSize 和 overlap 配置
- [ ] 保存 chunk 元数据：documentId、index、content、token estimate
- [ ] 写 chunk 单测
- [ ] 准备 3 份测试文档：产品 FAQ、技术文档、运维 runbook
- [ ] README 记录 chunk 策略选择
- [ ] Python 30 分钟：写一个 chunk 可视化脚本

验收：文档能稳定切成 chunk，且可追溯来源。

### Day 18：Embedding 入库

- [ ] 封装 `EmbeddingService`
- [ ] 批量生成 embedding
- [ ] 保存 vector 到 pgvector / Qdrant
- [ ] 处理 embedding 失败重试
- [ ] 记录 embedding model 和维度
- [ ] 增加 ingestion job 状态：pending / chunking / embedding / indexed / failed
- [ ] Python 30 分钟：理解 cosine similarity

验收：上传文档后能完成索引。

### Day 19：检索 API v1

- [ ] 实现 `POST /retrieval/search`
- [ ] 输入 query，生成 query embedding
- [ ] 返回 topK chunks
- [ ] 返回 score、documentId、chunkIndex
- [ ] 增加过滤条件：documentId、namespace
- [ ] 写 10 个检索测试问题
- [ ] Python 30 分钟：手写 cosine similarity demo

验收：输入问题能找回相关 chunk。

### Day 20：索引任务状态实时推送

- [ ] 用 WebSocket / SSE 推送 ingestion job 状态
- [ ] 设计事件：uploaded / chunking / embedding / indexed / failed
- [ ] 前端可先用简单 HTML 或 curl 测试
- [ ] 日志记录每一步耗时
- [ ] 增加失败重试入口
- [ ] README 增加 ingestion 流程图
- [ ] Python 30 分钟：学习 FastAPI 基础路由

验收：长任务状态能实时看到，这是你的简历强项迁移点。

### Day 21：Week 3 复盘

- [ ] 整理 RAG ingestion README
- [ ] 补充 Docker Compose 说明
- [ ] 写技术文章：`用 BullMQ 构建 RAG 文档异步索引管线`
- [ ] 打 tag：`week3-rag-ingestion`
- [ ] 整理 8 道 RAG 面试题
- [ ] 下周需求文档：RAG Chat with Citation

验收：RAG 的数据底座完成。

---

## Week 4：RAG 问答、引用、拒答与权限

目标：让 RAG 系统具备问答能力，并做到引用、拒答、基础权限控制。

### Day 22：RAG Chat API

- [ ] 实现 `POST /chat/rag`
- [ ] 流程：query -> retrieve -> build context -> generate answer
- [ ] 回答中必须包含 citations
- [ ] 保存 conversation 和 message
- [ ] 记录使用的 chunks
- [ ] README 增加调用示例
- [ ] Python 30 分钟：调用本地 RAG API 做批量提问

验收：能基于文档回答，并返回来源。

### Day 23：引用格式与来源追踪

- [ ] 定义 citation schema
- [ ] 每个答案返回 documentId、chunkId、quote、score
- [ ] 控制引用内容长度
- [ ] 如果 context 不足，要求模型回答“不知道”
- [ ] 增加 10 条拒答测试样例
- [ ] 单测 citation builder
- [ ] Python 30 分钟：生成 markdown 报告

验收：用户能知道答案来自哪个文档片段。

### Day 24：Hybrid Search 预研与关键词检索

- [ ] 增加关键词搜索 baseline
- [ ] 对比 vector search 与 keyword search
- [ ] 设计 hybrid score 合并策略
- [ ] 记录失败 case
- [ ] README 记录何时 vector search 失败
- [ ] 加入 query rewrite prompt
- [ ] Python 30 分钟：统计关键词召回情况

验收：知道 RAG 为什么会找错，不只是调用向量库。

### Day 25：Rerank 与 Context 压缩

- [ ] 实现简单 rerank：LLM rerank 或规则 rerank
- [ ] 控制传入模型的 context token 数
- [ ] 对低分 chunk 过滤
- [ ] 增加 maxContextChunks 配置
- [ ] 比较 rerank 前后的 10 个问题结果
- [ ] README 增加实验结果
- [ ] Python 30 分钟：学习 pandas 基础

验收：RAG 回答质量有可观察提升。

### Day 26：权限过滤

- [ ] 给文档增加 ownerId / visibility / allowedRoles
- [ ] 检索时加权限过滤
- [ ] 写越权访问测试
- [ ] 设计多租户 namespace
- [ ] README 增加 RAG 权限设计
- [ ] 记录“为什么不能先检索再过滤”的风险
- [ ] Python 30 分钟：写权限测试数据生成脚本

验收：用户不能检索到无权限文档。

### Day 27：RAG Eval v1

- [ ] 建立 `evals/rag-cases.json`
- [ ] 每条包含 question、expectedDoc、shouldAnswer
- [ ] 实现 `npm run eval:rag`
- [ ] 输出 retrieval hit rate、拒答准确率、平均延迟
- [ ] 保存评测报告到 `eval-reports/`
- [ ] README 增加评测结果
- [ ] Python 30 分钟：把报告转换为表格

验收：RAG 质量可以量化。

### Day 28：Week 4 复盘

- [ ] 打 tag：`week4-rag-chat-citation`
- [ ] 写文章：`RAG 系统如何做引用、拒答和权限过滤`
- [ ] 整理 10 道 RAG 面试题
- [ ] 录制 RAG demo 流程
- [ ] 准备 Week 5 Agent 工具系统需求文档

验收：第二个作品已经具备核心竞争力。

---

## Week 5：Tool Calling 与 AI Ops Agent

目标：创建 `ai-ops-agent`，把你的运维、WebSocket、Kafka、Redis、任务编排经验迁移到 Agent 项目。

### Day 29：AI Ops Agent 初始化

- [ ] 新建 `apps/ai-ops-agent`
- [ ] 设计工具列表：服务状态、日志、Kafka lag、Redis memory、incident 草稿
- [ ] 定义 Tool interface：name、description、schema、execute、riskLevel
- [ ] 实现工具注册中心 `ToolRegistry`
- [ ] README 写场景：告警分析助手
- [ ] Python 30 分钟：理解函数作为参数

验收：工具可以被注册和手动调用。

### Day 30：模拟运维数据源

- [ ] 准备 mock services：payment-service、user-service、market-service
- [ ] 准备 mock logs
- [ ] 准备 mock Kafka lag 数据
- [ ] 准备 mock Redis memory 数据
- [ ] 实现查询 API
- [ ] 用你 OneKey 行情数据源适配经验设计 adapter 层
- [ ] Python 30 分钟：写 mock 数据生成脚本

验收：Agent 有真实感的数据源可查。

### Day 31：LLM Tool Calling v1

- [ ] 接入工具调用能力
- [ ] 模型根据用户问题选择工具
- [ ] 执行工具并把结果交回模型
- [ ] 限制最大工具调用步数
- [ ] 记录每次 tool call
- [ ] 增加 `POST /agent/run`
- [ ] Python 30 分钟：用 Python 模拟 tool call JSON

验收：输入“查 payment-service 为什么报警”，Agent 会主动查服务状态和日志。

### Day 32：危险工具与人工确认

- [ ] 增加危险工具：`restartService`
- [ ] riskLevel=high 的工具不能自动执行
- [ ] Agent 只能生成 approval request
- [ ] 实现 `POST /approvals/:id/approve`
- [ ] 实现 `POST /approvals/:id/reject`
- [ ] 使用 Redis 锁避免重复审批
- [ ] Python 30 分钟：学习状态机基本写法

验收：危险操作必须人工确认。

### Day 33：WebSocket 实时执行状态

- [ ] 定义 Agent 事件：thinking / tool_call / tool_result / approval_required / final
- [ ] 实现 WebSocket 推送
- [ ] 客户端能看到 Agent 每一步
- [ ] 记录 event log 到 MongoDB
- [ ] 增加 traceId
- [ ] README 增加事件协议
- [ ] Python 30 分钟：学习 async/await

验收：这是你的 WebSocket 简历优势在 AI Agent 场景里的直接展示。

### Day 34：Agent 失败恢复

- [ ] 工具失败时返回结构化错误
- [ ] Agent 根据错误选择重试或降级
- [ ] 增加 step timeout
- [ ] 增加 max retries
- [ ] 增加最终失败报告
- [ ] 写 5 个失败 case
- [ ] Python 30 分钟：try/except 错误处理

验收：Agent 不会因为一个工具失败就崩掉。

### Day 35：Week 5 复盘

- [ ] 打 tag：`week5-ai-ops-tool-calling`
- [ ] 写文章：`如何用 NestJS 设计 Agent Tool Calling 系统`
- [ ] 整理 10 道 Tool Calling 面试题
- [ ] 更新简历项目描述：AI Ops Agent v1
- [ ] 准备 Week 6 Agent Loop 和任务编排需求

验收：第三个作品的核心雏形完成。

---

## Week 6：Agent Loop、记忆、审批和任务队列

目标：让 AI Ops Agent 从“调用工具”升级为“多步骤 Agent”。

### Day 36：Agent Loop 设计

- [ ] 设计 Agent step schema
- [ ] 实现 loop：plan -> act -> observe -> decide
- [ ] 每一步保存到 MongoDB
- [ ] 支持恢复指定 runId
- [ ] 限制最大 step 数
- [ ] README 增加 Agent Loop 流程图
- [ ] Python 30 分钟：写一个简单循环 Agent 模拟器

验收：Agent 能执行多轮工具调用后再总结。

### Day 37：Planner 与 Executor 拆分

- [ ] 实现 Planner：根据目标生成计划
- [ ] 实现 Executor：逐步执行计划
- [ ] 实现 Verifier：检查是否完成目标
- [ ] 每个阶段都有独立 prompt
- [ ] prompt version 化
- [ ] 写 3 个复杂告警案例
- [ ] Python 30 分钟：拆分函数和模块

验收：Agent 架构不再是一个大函数。

### Day 38：BullMQ 长任务执行

- [ ] Agent run 通过 BullMQ 执行
- [ ] API 立即返回 runId
- [ ] WebSocket 持续推送状态
- [ ] worker 支持并发数配置
- [ ] run 失败可重试
- [ ] 借鉴你数字人生成链路经验设计任务状态
- [ ] Python 30 分钟：队列概念复习

验收：Agent 支持长任务后台运行。

### Day 39：短期记忆与会话上下文

- [ ] 保存 conversation history
- [ ] 设计 memory window
- [ ] 支持用户追问
- [ ] 控制历史 token 数
- [ ] 把重要 tool result 摘要化保存
- [ ] 增加 memory 单测
- [ ] Python 30 分钟：文本摘要小脚本

验收：Agent 能基于上一轮结果继续分析。

### Day 40：审批流增强

- [ ] approval request 支持 reason、toolName、args、risk
- [ ] 审批超时自动取消
- [ ] 审批结果写入 audit log
- [ ] 拒绝后 Agent 生成替代方案
- [ ] 高风险工具必须二次确认
- [ ] README 增加 Human-in-the-loop 设计
- [ ] Python 30 分钟：写状态流转测试

验收：审批流可以作为生产级亮点展示。

### Day 41：Kafka 事件接入

- [ ] 模拟 Kafka alert topic
- [ ] Agent worker 消费告警事件
- [ ] 自动创建 Agent run
- [ ] 结果写回 incident topic 或 MongoDB
- [ ] 记录 offset / 幂等 key
- [ ] README 增加事件驱动 Agent 架构
- [ ] Python 30 分钟：学习消息队列基本模型

验收：Agent 不只是 API 触发，也能被事件触发。

### Day 42：Week 6 复盘

- [ ] 打 tag：`week6-agent-loop-workflow`
- [ ] 写文章：`从数字人异步任务编排到 AI Agent Workflow`
- [ ] 整理 10 道 Agent Loop 面试题
- [ ] 录制 AI Ops Agent demo
- [ ] 准备 Week 7 工作流引擎升级

验收：AI Ops Agent 成为你求职最强项目。

---

## Week 7：Workflow Engine / LangGraph.js 思想

目标：把自研异步流程控制经验包装成 Agent Workflow 能力。

### Day 43：状态机建模

- [ ] 定义 workflow node：AnalyzeAlert / CollectEvidence / Diagnose / ProposeAction / WaitApproval / Execute / Verify / Report
- [ ] 定义状态流转条件
- [ ] 定义 workflow context
- [ ] 画流程图
- [ ] README 解释为什么不用纯 Agent 自由循环
- [ ] Python 30 分钟：学习 enum 和 dataclass

验收：AI Ops Agent 有明确状态机。

### Day 44：实现 Workflow Runner

- [ ] 实现 `WorkflowRunner`
- [ ] 每个 node 是独立 class/function
- [ ] node 输入输出结构化
- [ ] 状态保存到 MongoDB
- [ ] 支持从任意 node 恢复
- [ ] 单测状态流转
- [ ] Python 30 分钟：写 mini workflow runner

验收：工作流可执行、可恢复、可测试。

### Day 45：Verifier 节点

- [ ] 实现诊断结果校验
- [ ] 检查是否有足够证据支持结论
- [ ] 如果证据不足，回到 CollectEvidence
- [ ] 限制最多回退次数
- [ ] 记录 verifier 结论
- [ ] 准备 5 个证据不足案例
- [ ] Python 30 分钟：写简单规则校验器

验收：Agent 不会随便下结论。

### Day 46：补偿与回滚设计

- [ ] 对写操作工具定义 compensation
- [ ] 对失败步骤生成 recovery plan
- [ ] 记录不可回滚操作
- [ ] 设计幂等 key
- [ ] 使用 Redis 锁防止重复执行
- [ ] README 增加可靠性章节
- [ ] Python 30 分钟：学习上下文管理器概念

验收：能讲清楚 Agent 执行动作失败后怎么办。

### Day 47：接入 LangGraph.js 或写对比文档

- [ ] 阅读 LangGraph.js 基础概念
- [ ] 尝试用 LangGraph.js 重写一个小 workflow
- [ ] 对比自研 Workflow Runner 与 LangGraph.js
- [ ] 写 `docs/langgraph-vs-custom-workflow.md`
- [ ] 总结适用场景
- [ ] Python 30 分钟：了解 Python LangGraph 示例

验收：面试时能讲框架，也能讲自研取舍。

### Day 48：工作流可视化事件

- [ ] 每个 node 开始/结束推送 WebSocket 事件
- [ ] 事件包含 nodeName、status、duration、summary
- [ ] 实现简单前端页面展示节点流转
- [ ] 失败节点高亮，或至少输出 JSON event
- [ ] 保存完整 trace
- [ ] README 增加截图
- [ ] Python 30 分钟：生成 trace 报告

验收：Agent 执行过程可视化。

### Day 49：Week 7 复盘

- [ ] 打 tag：`week7-agent-workflow-engine`
- [ ] 写文章：`生产级 Agent 为什么需要 Workflow，而不是无限循环`
- [ ] 整理 10 道 Workflow 面试题
- [ ] 更新项目架构图
- [ ] 准备 Week 8 MCP 需求

验收：你的“自研流程控制工具”经历已成功迁移到 AI Agent 方向。

---

## Week 8：MCP Server 与工具标准化

目标：完成 `nestjs-mcp-server`，展示你能把业务工具标准化接给 Agent。

### Day 50：MCP 基础与项目初始化

- [ ] 阅读 MCP 核心概念：server / client / tools / resources
- [ ] 新建 `apps/nestjs-mcp-server`
- [ ] 设计 MCP 暴露的 tools 和 resources
- [ ] 初始化 MCP server 依赖
- [ ] README 写 MCP 项目目标
- [ ] Python 30 分钟：理解 JSON-RPC 基础

验收：MCP Server 可以启动。

### Day 51：实现只读 Tools

- [ ] 实现 `get_service_status`
- [ ] 实现 `search_logs`
- [ ] 实现 `query_kafka_lag`
- [ ] 每个工具定义 input schema
- [ ] 每次调用写 audit log
- [ ] 加入 tool allowlist
- [ ] Python 30 分钟：写 JSON schema 示例

验收：只读工具可被 MCP client 调用。

### Day 52：实现 Resources

- [ ] 暴露 `service://payment-service/runbook`
- [ ] 暴露 `service://market-service/schema`
- [ ] 暴露 `docs://ops/escalation-policy`
- [ ] 资源内容可从本地 markdown 读取
- [ ] 增加资源权限检查
- [ ] README 增加 resources 示例
- [ ] Python 30 分钟：读取 markdown 文件

验收：Agent 可以读取 runbook 作为上下文。

### Day 53：写操作 Tools 与审批

- [ ] 实现 `create_incident_ticket`
- [ ] 实现 `restart_service` 但默认禁用或需要 approval token
- [ ] 高风险工具返回 pending approval
- [ ] 审计日志记录调用者、参数、结果
- [ ] 增加测试：无 approval 不能执行
- [ ] Python 30 分钟：权限装饰器概念

验收：MCP 写工具具备安全边界。

### Day 54：AI Ops Agent 接入 MCP Tools

- [ ] 在 AI Ops Agent 中实现 MCP client
- [ ] 从 MCP Server 拉取 tools
- [ ] 将 MCP tools 转成 Agent 可调用工具
- [ ] 跑通一次告警分析
- [ ] 记录 MCP tool call trace
- [ ] README 增加集成架构图
- [ ] Python 30 分钟：客户端请求封装

验收：Agent 不再只调用本地工具，而是调用 MCP 工具。

### Day 55：MCP 安全设计文档

- [ ] 写 `docs/mcp-security.md`
- [ ] 说明 tool allowlist
- [ ] 说明 read/write 工具分级
- [ ] 说明 human approval
- [ ] 说明 audit log
- [ ] 说明 prompt injection 风险
- [ ] Python 30 分钟：整理安全 checklist

验收：MCP 项目具备面试可讲的安全设计。

### Day 56：Week 8 复盘

- [ ] 打 tag：`week8-nestjs-mcp-server`
- [ ] 写文章：`如何用 NestJS 实现 MCP Server 接入 AI Agent`
- [ ] 整理 8 道 MCP 面试题
- [ ] 更新简历项目描述
- [ ] 准备 Week 9 评测和可观测性

验收：MCP 成为你的加分项目。

---

## Week 9：Eval、Observability、安全与成本优化

目标：把项目从 demo 打磨成生产化作品。

### Day 57：统一 Trace 模型

- [ ] 设计统一 `Trace` schema
- [ ] 记录 requestId / runId / userId / model / promptVersion / tokens / latency
- [ ] 记录 tool calls
- [ ] 记录 workflow nodes
- [ ] 三个项目统一日志格式
- [ ] Python 30 分钟：分析 trace JSON

验收：所有 AI 调用都可追踪。

### Day 58：Token 成本统计

- [ ] 记录 inputTokens、outputTokens、totalTokens
- [ ] 增加成本估算配置
- [ ] 输出每日/每次运行成本
- [ ] RAG 中记录 context token 数
- [ ] Agent 中记录每个 step 成本
- [ ] README 增加成本优化策略
- [ ] Python 30 分钟：生成成本统计表

验收：你能回答“如何控制 LLM 成本”。

### Day 59：Agent Eval Suite

- [ ] 新建 `packages/agent-eval-suite`
- [ ] 定义 eval case 格式
- [ ] 支持评估 ticket、rag、ops-agent
- [ ] 指标：准确率、工具调用正确率、拒答准确率、延迟、成本
- [ ] 输出 markdown 报告
- [ ] Python 30 分钟：用 Python 生成图表或表格

验收：一个命令能跑核心评测。

### Day 60：Prompt Injection 测试集

- [ ] 准备 20 条 prompt injection case
- [ ] 覆盖：泄露系统 prompt、越权工具调用、忽略规则、伪造上下文
- [ ] 对 RAG 和 Agent 分别测试
- [ ] 输出安全评测报告
- [ ] 加入 CI 可选执行
- [ ] README 增加安全测试结果
- [ ] Python 30 分钟：整理安全 case

验收：能证明你知道 Agent 安全问题。

### Day 61：性能与并发测试

- [ ] 对 ticket classifier 做并发测试
- [ ] 对 RAG 检索做 topK 延迟测试
- [ ] 对 Agent run 做并发 worker 测试
- [ ] 记录 Redis / MongoDB / Queue 指标
- [ ] 找 2 个瓶颈并优化
- [ ] README 增加压测结论
- [ ] Python 30 分钟：写简单并发请求脚本

验收：项目不是单用户 demo。

### Day 62：错误处理与降级

- [ ] LLM 超时降级
- [ ] Embedding 失败重试
- [ ] Tool 失败 fallback
- [ ] Queue 失败重放
- [ ] WebSocket 断连恢复说明
- [ ] README 增加可靠性设计
- [ ] Python 30 分钟：错误分类总结

验收：能讲清楚生产环境异常怎么处理。

### Day 63：Week 9 复盘

- [ ] 打 tag：`week9-eval-observability-security`
- [ ] 写文章：`AI Agent 上线前必须做的 Eval、Trace 和安全检查`
- [ ] 整理 12 道生产化面试题
- [ ] 准备 Week 10 求职材料

验收：项目已经从“能跑”变成“能讲生产化”。

---

## Week 10：作品集、简历和面试冲刺

目标：完成可投递材料。

### Day 64：GitHub 首页与项目 README 打磨

- [ ] 整理 GitHub profile README
- [ ] 三个主项目 README 顶部增加亮点
- [ ] 每个项目增加架构图
- [ ] 每个项目增加快速启动
- [ ] 每个项目增加 demo 流程
- [ ] 每个项目增加“面试讲解点”
- [ ] Python 30 分钟：整理所有 eval 报告链接

验收：招聘方打开 GitHub 能快速看懂你的能力。

### Day 65：简历 AI Agent 版本 v1

- [ ] 将“个人总结”改成 AI Agent 后端方向
- [ ] 技能增加：LLM、RAG、Tool Calling、MCP、Eval、Observability
- [ ] 不要删除原 Node.js 强项，而是迁移表达
- [ ] 新增 2 个 AI Agent 项目
- [ ] 原工作经历中加入 AI Agent 相关转化关键词
- [ ] 准备中文简历 v1
- [ ] Python 30 分钟：无，今天集中简历

验收：简历能投 AI Backend / Agent 应用开发岗位。

### Day 66：简历项目描述优化

- [ ] 为 `enterprise-rag-agent` 写 4 条 STAR 描述
- [ ] 为 `ai-ops-agent` 写 5 条 STAR 描述
- [ ] 为 `nestjs-mcp-server` 写 3 条 STAR 描述
- [ ] 每条包含技术、动作、结果
- [ ] 避免空话，多写工程细节
- [ ] 准备英文关键词版本

验收：每个项目都能在 1 分钟内讲清楚。

### Day 67：面试题第一轮

- [ ] 整理 50 道面试题
- [ ] 分类：LLM 基础、RAG、Tool Calling、Agent Workflow、MCP、后端工程、系统设计
- [ ] 每题写 3-6 行答案
- [ ] 录音模拟回答 10 题
- [ ] 找回答不顺的问题补资料

验收：基础问题不会卡壳。

### Day 68：系统设计面试准备

- [ ] 准备题目：设计企业知识库 Agent
- [ ] 准备题目：设计 AI 运维告警 Agent
- [ ] 准备题目：设计异步视频生成 Agent
- [ ] 每题画架构图
- [ ] 每题讲清楚数据流、任务流、错误处理、安全、成本
- [ ] 总结标准回答模板

验收：系统设计能体现你的后端经验。

### Day 69：投递材料与岗位筛选

- [ ] 准备 3 个简历版本：AI Backend、Node.js + AI、Agent 应用开发
- [ ] 准备 1 段自我介绍
- [ ] 准备 GitHub 项目链接清单
- [ ] 筛选 30 个目标岗位
- [ ] 按岗位 JD 标注关键词
- [ ] 根据 JD 微调简历关键词

验收：可以开始正式投递。

### Day 70：最终复盘与发布

- [ ] 所有项目打最终 tag：`job-ready-v1`
- [ ] 写总复盘：`Node.js 后端转 AI Agent 开发 10 周路线总结`
- [ ] 确认所有 README 可运行
- [ ] 确认 `.env.example` 完整
- [ ] 确认 demo case 可复现
- [ ] 列出后续 30 天改进计划
- [ ] 开始投递并记录反馈

验收：完成第一轮转型作品集。

---

# 3. 项目优先级

如果时间不够，按这个顺序保交付：

1. [ ] `ai-ops-agent`：最贴合你的简历，优先级最高
2. [ ] `enterprise-rag-agent`：AI Agent 岗位常见必备能力
3. [ ] `ai-ticket-classifier`：基础项目，用来展示结构化输出和评测
4. [ ] `nestjs-mcp-server`：加分项，时间不够可以做轻量版
5. [ ] `agent-eval-suite`：至少保留基础评测，不必做复杂 UI

---

# 4. 每周产出清单

| 周数    | 核心产出                      | 求职价值                     |
| ------- | ----------------------------- | ---------------------------- |
| Week 1  | 工单分类 MVP                  | 证明会 LLM API + 结构化输出  |
| Week 2  | 工单系统工程化                | 证明会评测、缓存、日志、部署 |
| Week 3  | RAG 索引管线                  | 证明会异步文档处理和向量检索 |
| Week 4  | RAG 问答与引用                | 证明会知识库 Agent           |
| Week 5  | Tool Calling Agent            | 证明会 Agent 调工具          |
| Week 6  | Agent Loop + 队列 + WebSocket | 证明会生产级 Agent 后端      |
| Week 7  | Workflow Engine               | 证明会复杂流程编排           |
| Week 8  | MCP Server                    | 证明了解 Agent 工具标准化    |
| Week 9  | Eval / Trace / Security       | 证明不是 demo 型选手         |
| Week 10 | 简历 / 面试 / 投递            | 转化为求职成果               |

---

# 5. 简历改造 TODO

## 个人总结改造方向

- [ ] 加入“AI Agent 应用开发”定位
- [ ] 保留“3 年+ Node.js 后端开发经验”
- [ ] 强调“异步任务编排、工具调用、实时状态推送、RAG、MCP、评测与可观测性”
- [ ] 不要写“熟悉大模型训练”，除非真的做过

示例：

> 3 年+ Node.js / TypeScript 后端开发经验，熟悉 NestJS、MongoDB、Redis、BullMQ、Kafka、WebSocket、Docker，具备从 0 到 1 搭建高并发后端服务和复杂异步任务系统的能力。近期聚焦 AI Agent 应用开发，能够基于 LLM、RAG、Tool Calling、MCP、Workflow、Human-in-the-loop、Eval 与 Observability 构建可上线的 Agent 后端系统。曾负责数字人视频生成链路、实时行情推送、支付一致性和多渠道任务调度，能将复杂业务流程抽象为可靠的 Agent 工具和任务编排系统。

## 技能区新增关键词

- [ ] LLM Application：structured output、tool calling、streaming、prompt versioning
- [ ] RAG：chunking、embedding、vector search、citation、rerank、permission filtering
- [ ] Agent：agent loop、workflow、human-in-the-loop、tool registry、audit log
- [ ] MCP：tools、resources、schema、tool permission、MCP server
- [ ] AI Observability：trace、token cost、latency、eval dataset、regression test

## 项目区新增描述模板

### AI Ops Agent

- [ ] 基于 NestJS / TypeScript / BullMQ / Redis / WebSocket 构建运维自动化 Agent，支持告警分析、日志检索、Kafka lag 查询、Redis 指标查询、incident 草稿生成与人工审批。
- [ ] 设计 Tool Registry，将服务状态、日志、队列指标等后端能力封装为可被 LLM 调用的工具，并通过 Zod Schema 做参数校验和结果约束。
- [ ] 使用 BullMQ 实现长任务 Agent Run，结合 WebSocket 实时推送 thinking、tool_call、approval_required、final 等执行事件。
- [ ] 设计高风险工具 Human-in-the-loop 机制，对重启服务等操作加入审批、Redis 幂等锁和审计日志，避免 Agent 越权执行。
- [ ] 建立 Agent Eval 数据集，评估工具调用准确率、诊断准确率、拒绝执行准确率、平均延迟和 token 成本。

### Enterprise RAG Agent

- [ ] 基于 NestJS / BullMQ / pgvector 构建企业知识库 RAG Agent，支持文档上传、异步解析、chunking、embedding、向量检索、引用回答与拒答。
- [ ] 设计文档级权限过滤和 namespace 隔离，避免用户检索到无权限知识内容。
- [ ] 通过 RAG Eval 评估 retrieval hit rate、citation accuracy、拒答准确率和延迟。

---

# 6. 面试题 TODO

## LLM 基础

- [ ] 什么是 structured output？为什么不能直接相信模型输出？
- [ ] function calling 和 tool calling 的区别是什么？
- [ ] temperature 如何影响输出？
- [ ] 如何处理 LLM 超时和失败？
- [ ] 如何降低 token 成本？

## RAG

- [ ] RAG 的完整链路是什么？
- [ ] chunk 太大或太小分别有什么问题？
- [ ] 为什么向量检索会找错？
- [ ] 什么是 rerank？什么时候需要？
- [ ] 如何做 RAG 权限控制？
- [ ] 如何判断 RAG 回答是否应该拒答？

## Agent

- [ ] Agent 和 Chatbot 的区别是什么？
- [ ] Agent Loop 如何设计？
- [ ] 如何限制 Agent 死循环？
- [ ] 如何做危险工具审批？
- [ ] Tool schema 如何设计？
- [ ] Agent 调用工具失败怎么办？
- [ ] 如何设计 Agent 的审计日志？

## Workflow

- [ ] 为什么生产 Agent 需要 Workflow？
- [ ] 状态机和自由 Agent Loop 的区别是什么？
- [ ] 长任务 Agent 如何恢复？
- [ ] BullMQ 和 Kafka 在 Agent 系统中分别适合做什么？
- [ ] WebSocket / SSE 在 Agent 产品中有什么用？

## MCP

- [ ] MCP 解决了什么问题？
- [ ] Tools 和 Resources 的区别是什么？
- [ ] MCP Server 如何做权限控制？
- [ ] 为什么 MCP 工具不能暴露任意命令执行？

## 后端工程

- [ ] 如何设计高并发 LLM API 服务？
- [ ] 如何做幂等？
- [ ] 如何用 Redis 锁防止重复执行？
- [ ] 如何设计任务重试和补偿？
- [ ] 如何做日志、trace、监控？

---

# 7. 30 天后加分方向

完成 10 周计划后，再做这些加分项：

- [ ] 给 AI Ops Agent 做一个简单前端控制台
- [ ] 接入真实云日志或 OpenTelemetry trace
- [ ] 支持多模型 fallback
- [ ] 支持多租户和 RBAC
- [ ] 支持 Agent run replay
- [ ] 支持 benchmark 对比不同模型
- [ ] 把 MCP Server 拆成 npm package
- [ ] 写英文 README
- [ ] 准备英文自我介绍

---

# 8. 每日复盘模板

```md
## Day X 复盘

### 今天完成

-

### 遇到的问题

-

### 解决方案

-

### 明天计划

-

### Git commit

-

### 面试可讲点

-
```

---

# 9. 判断自己是否进入“可投递状态”

满足以下条件即可开始投 AI Agent 应用开发岗位：

- [ ] 至少 2 个项目 README 完整
- [ ] 至少 1 个项目有 Docker Compose 一键启动
- [ ] 至少 1 个项目有 eval 报告
- [ ] 至少 1 个项目有 WebSocket / SSE 实时执行状态
- [ ] 至少 1 个项目有 Tool Calling + Human-in-the-loop
- [ ] 能讲清楚 RAG、Tool Calling、Agent Workflow、MCP、Eval
- [ ] 简历中有 AI Agent 项目描述
- [ ] GitHub 有持续 commit 记录
- [ ] 准备好 1 分钟、3 分钟、5 分钟项目介绍

---

# 10. 学习资料清单

> 使用原则：先看官方文档，边做项目边查；不要“收藏式学习”。每个资料都要对应到 TODO 里的某个交付物。

## 10.1 第一优先级：必须看

### OpenAI / LLM 基础

- [ ] OpenAI Prompt Engineering Guide  
       https://developers.openai.com/api/docs/guides/prompt-engineering  
       用途：学习如何写稳定 system prompt、如何降低模型随机性、如何让模型按要求输出。

- [ ] OpenAI Agents SDK TypeScript  
       https://openai.github.io/openai-agents-js/  
       用途：理解 Agent、tool、handoff、guardrail、trace 等概念，适合和 Node.js 技术栈结合。

- [ ] OpenAI TypeScript / JavaScript SDK  
       https://developers.openai.com/api/reference/typescript/  
       用途：掌握服务端 TS 调用方式、错误处理、流式输出和 SDK 基础。

- [ ] OpenAI Evals Guide  
       https://developers.openai.com/api/docs/guides/evals  
       用途：第 9 周做 eval 时参考，理解为什么 Agent 项目必须有测试集和回归评估。

### Vercel AI SDK

- [ ] AI SDK Introduction  
       https://ai-sdk.dev/docs/introduction  
       用途：TS AI 应用主工具之一，适合做 structured output、streaming、tools。

- [ ] AI SDK Generating Structured Data  
       https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data  
       用途：对应 Week 1 的 `ai-ticket-classifier`，重点看 Zod schema 和结构化输出。

- [ ] AI SDK Tools  
       https://ai-sdk.dev/docs/foundations/tools  
       用途：对应 Week 5-6 的 AI Ops Agent，学习 tool schema、execute、multi-step 调用。

- [ ] AI SDK MCP Tools  
       https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools  
       用途：对应 Week 8 的 NestJS MCP Server，学习如何让 AI 应用接入 MCP server。

### LangChain.js / LangGraph.js

- [ ] LangChain.js Agents  
       https://docs.langchain.com/oss/javascript/langchain/agents  
       用途：理解 Agent = LLM + Tools + Loop + Stop Condition / Iteration Limit。

- [ ] LangChain.js Overview  
       https://docs.langchain.com/oss/javascript/langchain/overview  
       用途：快速理解 LangChain 在 JS 生态中的定位。

- [ ] LangGraph.js Overview  
       https://docs.langchain.com/oss/javascript/langgraph/overview  
       用途：对应 Week 7，重点理解 stateful workflow、human-in-the-loop、durable execution。

### MCP

- [ ] MCP 官方文档  
       https://modelcontextprotocol.io/docs  
       用途：理解 MCP 的 Host / Client / Server、Tools、Resources、Prompts。

- [ ] MCP TypeScript SDK  
       https://ts.sdk.modelcontextprotocol.io/  
       用途：对应 `nestjs-mcp-server`，用 TS 实现 MCP server。

- [ ] MCP SDK 总览  
       https://modelcontextprotocol.io/docs/sdk  
       用途：了解 MCP SDK 支持创建 server、client，以及 tools/resources/prompts。

### RAG / Vector Search

- [ ] LlamaIndex TypeScript / LlamaIndex Docs  
       https://developers.llamaindex.ai/typescript/framework/  
       用途：对应 Week 3-4 的 RAG 项目，学习文档 ingestion、retrieval、query engine。

- [ ] Qdrant Documentation  
       https://qdrant.tech/documentation/  
       用途：如果你选择 Qdrant 作为向量库，重点看 collections、points、payload filter、search。

- [ ] pgvector  
       https://github.com/pgvector/pgvector  
       用途：如果你选择 PostgreSQL + pgvector，重点看向量相似度、索引、过滤条件。

- [ ] pgvector-node  
       https://github.com/pgvector/pgvector-node  
       用途：Node.js / TypeScript 项目接 pgvector 时参考。

### BullMQ / NestJS 工程化

- [ ] NestJS Queues  
       https://docs.nestjs.com/techniques/queues  
       用途：把你已有的 Bull/BullMQ 经验包装成 AI Agent 长任务执行能力。

- [ ] BullMQ Retrying Failing Jobs  
       https://docs.bullmq.io/guide/retrying-failing-jobs  
       用途：对应 Week 2 和 Week 6，设计 LLM 调用失败重试、Agent run 失败恢复。

- [ ] BullMQ Flows  
       https://docs.bullmq.io/guide/flows  
       用途：对应 Week 7，把多步异步任务编排和 Agent Workflow 联系起来。

---

## 10.2 按周对应学习资料

### Week 1-2：结构化输出与工程化 LLM API

必看：

- OpenAI Prompt Engineering Guide
- AI SDK Generating Structured Data
- OpenAI TypeScript SDK
- NestJS Queues
- BullMQ Retrying Failing Jobs

学习目标：

- [ ] 能写稳定 prompt
- [ ] 能用 Zod 约束输出
- [ ] 能处理 JSON 解析失败
- [ ] 能记录 token、latency、prompt version
- [ ] 能把 LLM 调用放进队列任务里

---

### Week 3-4：RAG

必看：

- LlamaIndex TypeScript Docs
- Qdrant Docs 或 pgvector Docs
- AI SDK Embeddings / Structured Data
- OpenAI Evals Guide

学习目标：

- [ ] 理解 chunking、embedding、retrieval、rerank
- [ ] 能做带引用回答
- [ ] 能做权限过滤
- [ ] 能做 RAG eval

---

### Week 5-6：Tool Calling / Agent Loop

必看：

- AI SDK Tools
- LangChain.js Agents
- OpenAI Agents SDK TypeScript
- BullMQ Flows

学习目标：

- [ ] 能设计 Tool Registry
- [ ] 能区分只读工具和危险工具
- [ ] 能实现 human-in-the-loop
- [ ] 能限制 Agent 最大步数
- [ ] 能记录完整 tool trace

---

### Week 7：Workflow

必看：

- LangGraph.js Overview
- BullMQ Flows
- NestJS Queues

学习目标：

- [ ] 能解释自由 Agent Loop 和状态机 Workflow 的区别
- [ ] 能设计 AgentRun 生命周期
- [ ] 能实现 checkpoint / resume
- [ ] 能把你过往“数字人视频生成链路”的异步编排经验迁移到 Agent Workflow

---

### Week 8：MCP

必看：

- MCP 官方文档
- MCP TypeScript SDK
- AI SDK MCP Tools

学习目标：

- [ ] 能写 MCP Server
- [ ] 能暴露 tools / resources / prompts
- [ ] 能做权限控制和审计日志
- [ ] 能讲清楚 MCP 解决了什么问题

---

### Week 9-10：Eval、观测、求职

必看：

- OpenAI Evals Guide
- OpenAI Evaluation Best Practices
- LangGraph / LangSmith 相关 tracing 文档
- 你自己项目的 README 和日志

学习目标：

- [ ] 每个核心项目有 eval 或测试集
- [ ] 能展示 Agent run trace
- [ ] 能把项目讲成面试故事
- [ ] 能把后端经验升级成 AI Agent 后端能力

---

## 10.3 学习顺序建议

不要从框架大全开始。按这个顺序：

```text
1. OpenAI Prompt Engineering
2. AI SDK Structured Output
3. AI SDK Tools
4. LangChain.js Agents
5. RAG：LlamaIndex.TS + Qdrant/pgvector
6. LangGraph.js Workflow
7. MCP TypeScript SDK
8. Evals / Observability / Security
```

---

## 10.4 每天看资料的规则

每天最多看 30 分钟资料，除非当天任务卡住。

推荐流程：

```text
先写代码 60-90 分钟
遇到概念不清楚再查文档
查完马上回到项目
当天 README 里记录 3 条新学到的点
```

不要这样学：

```text
收藏 50 个链接
看 3 天视频
一行代码不写
换框架重来
```

---

## 10.5 可选 Python 学习资料

Python 不作为强制任务，但如果你有时间，可以只学这些：

- [ ] Python 基础语法
- [ ] venv / pip / uv
- [ ] FastAPI 基础
- [ ] 用 Python 写简单 eval 脚本
- [ ] 看懂 LangChain / LlamaIndex 的 Python 示例

建议节奏：

```text
每周 1-2 次，每次 30 分钟
只为辅助理解 Agent 生态，不改变主线
```

---

## 10.6 必读概念清单

学完每个概念后，在 README 或技术笔记里写 3-5 句话解释。

- [ ] Structured Output
- [ ] Function Calling / Tool Calling
- [ ] Agent Loop
- [ ] Stop Condition
- [ ] Tool Schema
- [ ] Human-in-the-loop
- [ ] RAG
- [ ] Chunking
- [ ] Embedding
- [ ] Vector Search
- [ ] Hybrid Search
- [ ] Rerank
- [ ] Citation
- [ ] Prompt Injection
- [ ] Tool Injection
- [ ] Workflow / State Machine
- [ ] Checkpoint
- [ ] Eval
- [ ] Trace
- [ ] MCP Tools
- [ ] MCP Resources
- [ ] Agent Observability

---

## 10.7 每周输出要求

### 每周至少 1 次

- [ ] 提交 GitHub
- [ ] 更新 README
- [ ] 写 1 篇技术笔记
- [ ] 准备 1 段面试表达
- [ ] 找我验收 1 次

### 技术笔记题目建议

- [ ] Node.js 后端如何做 LLM 结构化输出
- [ ] 为什么 AI Agent 必须有 Tool Calling 审计日志
- [ ] 用 BullMQ 设计长任务 Agent Workflow
- [ ] RAG 项目中 Chunking 策略怎么选
- [ ] MCP Server 在企业 Agent 中解决什么问题
- [ ] Human-in-the-loop 如何防止 Agent 误操作
- [ ] AI Ops Agent 如何结合 Kafka 告警事件
