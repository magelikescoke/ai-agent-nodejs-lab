# Retrieval Search 测试报告

日期：2026-04-29

## 测试范围

本次实现并验证 `apps/enterprise-rag-agent` 的检索 API v1：

- `POST /retrieval/search`
- query embedding 调用
- Qdrant topK vector search
- 返回 `score`、`documentId`、`chunkIndex`、`content`
- 默认无过滤条件，全局检索已索引 chunks
- 支持可选 `documentId` payload filter

## 测试命令

```bash
npm test --workspace enterprise-rag-agent
npm run build --workspace enterprise-rag-agent
```

提交前还需要执行：

```bash
npm run lint
```

## 自动化实际结果

| Test Suite                                          | 覆盖点                                                               | Actual |
| --------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| `src/retrieval/retrieval.service.spec.ts`           | query trim、默认 topK、默认无 filter、documentId filter、返回 chunks | Pass   |
| `src/embedding/qdrant-vector-store.service.spec.ts` | Qdrant search request、默认无 filter、documentId filter、payload map | Pass   |
| `src/embedding/embedding.service.spec.ts`           | OpenAI-compatible embeddings 请求与排序                              | Pass   |
| `src/ingestion/document-splitter.strategy.spec.ts`  | 测试文档可切分并保留 chunk metadata                                  | Pass   |

## 端到端实际结果

本次使用根目录 `.env` 中的 GLM key 生成了 `apps/enterprise-rag-agent/.env`，并完成 3 份测试文档真实 embedding 入库：

| Document                | Chunks | Embedding Model | Dimensions |
| ----------------------- | -----: | --------------- | ---------: |
| `product-faq.md`        |      2 | `embedding-3`   |       1024 |
| `technical-guide.md`    |      2 | `embedding-3`   |       1024 |
| `operations-runbook.md` |      2 | `embedding-3`   |       1024 |

随后对 30 个问题执行真实 query embedding + Qdrant top3 search，按 top1 source 计算：

```text
top1Pass: 28 / 30
top1Accuracy: 0.9333
```

## 检索问题与实际结果

问题样例保存在：

```text
apps/enterprise-rag-agent/test-data/retrieval-questions.json
```

| Query                                          | Expected Source         | Expected Topic       | Actual Top1 Source      | Chunk |  Score | Result |
| ---------------------------------------------- | ----------------------- | -------------------- | ----------------------- | ----: | -----: | ------ |
| 忘记密码后重置链接多久有效？                   | `product-faq.md`        | 账号与登录           | `product-faq.md`        |     0 | 0.5180 | Pass   |
| 验证码输错几次账号会被锁？锁多久？             | `product-faq.md`        | 账号与登录           | `product-faq.md`        |     0 | 0.4983 | Pass   |
| SAML 单点登录在哪里配置？                      | `product-faq.md`        | 账号与登录           | `product-faq.md`        |     0 | 0.6102 | Pass   |
| 新成员邀请后默认是什么角色？                   | `product-faq.md`        | 账号与登录           | `product-faq.md`        |     0 | 0.4500 | Pass   |
| 年度合同在哪里查看到期时间？                   | `product-faq.md`        | 订阅与计费           | `product-faq.md`        |     1 | 0.5137 | Pass   |
| 套餐降级什么时候生效？                         | `product-faq.md`        | 订阅与计费           | `product-faq.md`        |     0 | 0.5072 | Pass   |
| 已经开具的发票信息还能直接修改吗？             | `product-faq.md`        | 订阅与计费           | `product-faq.md`        |     0 | 0.4490 | Pass   |
| 企业版自定义工单状态有什么限制？               | `product-faq.md`        | 工单与自动化         | `product-faq.md`        |     0 | 0.6490 | Pass   |
| 自动分派规则可以按哪些条件匹配？               | `product-faq.md`        | 工单与自动化         | `product-faq.md`        |     0 | 0.5229 | Pass   |
| 合并重复工单后 SLA 统计会怎么处理？            | `product-faq.md`        | 工单与自动化         | `operations-runbook.md` |     0 | 0.6516 | Fail   |
| 标准套餐工单数据保存多久？                     | `product-faq.md`        | 数据与安全           | `product-faq.md`        |     1 | 0.7130 | Pass   |
| 审计日志可以按哪些条件筛选？                   | `product-faq.md`        | 数据与安全           | `product-faq.md`        |     1 | 0.5285 | Pass   |
| 数据导出链接有效期是几天？                     | `product-faq.md`        | 数据与安全           | `product-faq.md`        |     1 | 0.6412 | Pass   |
| Webhook 支持哪些事件类型？                     | `technical-guide.md`    | 概述                 | `technical-guide.md`    |     0 | 0.7425 | Pass   |
| Webhook 目标 URL 多久内必须返回 2xx？          | `technical-guide.md`    | 快速开始             | `technical-guide.md`    |     0 | 0.6843 | Pass   |
| Webhook 事件 payload 里有哪些基础字段？        | `technical-guide.md`    | 事件格式             | `technical-guide.md`    |     0 | 0.7402 | Pass   |
| Webhook 签名算法是什么？                       | `technical-guide.md`    | 鉴权与签名           | `technical-guide.md`    |     0 | 0.6794 | Pass   |
| X-AcmeDesk-Timestamp 的重放保护窗口建议多长？  | `technical-guide.md`    | 重放保护             | `technical-guide.md`    |     1 | 0.6103 | Pass   |
| Webhook 投递失败会重试几次？                   | `technical-guide.md`    | 重试策略             | `technical-guide.md`    |     1 | 0.7081 | Pass   |
| 单个组织 Webhook 每分钟最多投递多少事件？      | `technical-guide.md`    | 速率限制             | `technical-guide.md`    |     0 | 0.6754 | Pass   |
| Webhook payload 新增字段时接收方应该怎么处理？ | `technical-guide.md`    | 版本兼容             | `technical-guide.md`    |     0 | 0.7076 | Pass   |
| ticket_api_p95_latency_ms 超过多少需要排查？   | `operations-runbook.md` | 触发条件             | `operations-runbook.md` |     0 | 0.7246 | Pass   |
| TicketQueueBacklogHigh 的触发阈值是什么？      | `operations-runbook.md` | 触发条件             | `operations-runbook.md` |     0 | 0.6572 | Pass   |
| 工单列表加载很慢时，15 分钟内要判断哪些组件？  | `operations-runbook.md` | 背景                 | `operations-runbook.md` |     0 | 0.7049 | Pass   |
| 健康检查失败时应该先看什么？                   | `operations-runbook.md` | 快速诊断             | `operations-runbook.md` |     1 | 0.5307 | Pass   |
| Mongo 慢查询要重点关注哪些集合？               | `operations-runbook.md` | 检查 MongoDB         | `operations-runbook.md` |     1 | 0.6444 | Pass   |
| Redis 内存接近上限时应该怎么缓解？             | `operations-runbook.md` | 检查 Redis 和 BullMQ | `operations-runbook.md` |     1 | 0.6118 | Pass   |
| 队列积压但 API 正常时应该先做什么？            | `operations-runbook.md` | 队列积压             | `operations-runbook.md` |     1 | 0.6696 | Pass   |
| 下游 LLM 返回 429 时 worker 并发应该怎么调？   | `operations-runbook.md` | 队列积压             | `operations-runbook.md` |     0 | 0.6176 | Pass   |
| 事故复盘需要记录哪些内容？                     | `operations-runbook.md` | 事后复盘             | `technical-guide.md`    |     1 | 0.5204 | Fail   |

## 测试用例质量 Review

当前 30 条问题比初版更贴近真实用户提问，原因如下：

- 覆盖了“直接问答案”的 FAQ 场景，例如重置链接有效期、默认角色、导出链接有效期。
- 覆盖了“精确术语/指标”场景，例如 `ticket_api_p95_latency_ms`、`TicketQueueBacklogHigh`、`X-AcmeDesk-Timestamp`。
- 覆盖了“操作流程/排障动作”场景，例如健康检查失败、Redis 内存接近上限、LLM 返回 429。
- 覆盖了“约束/限制”场景，例如 Webhook 2xx 时限、每分钟投递上限、自定义状态必须保留终态。

仍然不够真实的地方：

- 还没有错别字、口语化缩写、英文混中文等噪声输入。
- 还没有多意图问题，例如“SSO 怎么开，失败了怎么排查？”。
- 还没有无答案问题，用来测试 RAG 是否应该拒答。
- 还没有权限过滤问题，因为当前业务模型还没有正式 `tenantId/userId` 字段。

这组用例适合作为 retrieval v1 的基础回归集；下一版建议增加 noisy query、无答案 query 和多意图 query。

## 结论

当前自动化测试已经验证检索 API 的工程契约：请求校验、query embedding、Qdrant topK search、payload filter 和返回结构。真实端到端评测 top1 source 命中率为 93.33%。

失败样例有两类：第一类是“合并重复工单后 SLA 统计会怎么处理？”，被 runbook 中与 SLA/工单相关的运维内容抢到 top1；第二类是“事故复盘需要记录哪些内容？”，实际 top1 命中了 `technical-guide.md`。这说明纯 dense vector 在相近泛化语义上可能误召回，后续应考虑更细粒度 Markdown chunk、关键词/稀疏检索混合召回，或在 Chat 前增加 rerank。

## 字段说明

当前业务模型没有 `namespace` 字段。检索 API 默认不需要 `documentId` 或其他 scope 参数，大多数用户问题会走全局 topK 召回。`documentId` 只用于用户明确限定某份文档时。

后续如果要做租户或用户级权限隔离，不应使用泛化的 `namespace` 名称临时替代，而应正式在 `Document`、`Chunk` 和 Qdrant payload 中引入 `tenantId` / `userId`，并让 Retrieval 默认带权限过滤。
