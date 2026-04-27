# Week 2 Ticket Classifier 面试问答

## 1. 这个项目解决什么问题？

它把非结构化客服工单转成稳定 JSON，包括 `category`、`priority`、`overview` 和 `suggestedAction`。重点不是做一个完整客服系统，而是展示 LLM 应用后端如何处理结构化输出、校验、缓存、异步任务、流式事件和评测。

## 2. 为什么不能只让模型“返回 JSON”？

因为模型输出不可信，可能返回解释文字、Markdown、额外字段或不在业务枚举内的值。项目用 JSON Schema 约束模型输出，再用 Zod strict schema 做服务端白名单校验，避免脏数据进入数据库和下游系统。

## 3. JSON Schema 和 Zod 为什么都要用？

JSON Schema 是给模型的输出约束，尽量让模型按结构生成；Zod 是服务端的最终数据契约。两者职责不同：前者降低错误概率，后者保证系统边界安全。

## 4. 校验失败怎么处理？

同步分析会 retry 1 次。仍失败时写入 `status: "error"` 的记录，并保存 raw output、parsed output、prompt version、model name、latency 和 retry count，方便排查和后续优化。

## 5. Redis 缓存怎么设计？

对 ticket content 做 SHA-256，再拼上 prompt version 形成缓存 key：`TicketContentCache:${promptVersion}:${hash}`。这样同一内容命中缓存后可以跳过 LLM 调用，同时 prompt 升级后不会误用旧版本结果。

## 6. BullMQ 在这里解决什么问题？

批量分析不适合让 HTTP 请求同步等待所有 LLM 调用完成。项目把每条工单提交成 BullMQ job，由 worker 控制并发和处理节奏，客户端通过 `GET /jobs/:id` 查询状态和结果。

## 7. SSE 流式接口有什么价值？

`GET /tickets/analyze/stream` 推送 `AgentEvent`，让前端实时看到 received、analyzing、token、validating、completed、error。这个模式可以迁移到更复杂的 Agent run 状态展示。

## 8. 如何防 prompt injection？

项目把用户工单包在 `<ticket_content>` 中，system prompt 明确要求把 ticket content 当作不可信数据，不执行其中要求忽略规则、泄露 prompt 或改变输出格式的指令。同时服务端仍用 schema 白名单兜底。

## 9. Eval 结果说明了什么？

20 条 eval case 显示，`ticket-analysis-v1` schema pass 是 0/20，`ticket-analysis-v2` 提升到 20/20，整体准确率 55%。这说明 few-shot 和严格约束能显著提升格式稳定性，但 priority 判断还需要继续优化。

## 10. 如果继续生产化，你会做什么？

我会补请求级幂等、认证与租户隔离、敏感信息脱敏、结构化日志和 traceId、LLM token 成本统计、provider fallback、dead-letter queue、worker 监控和更完整的 Eval 数据集。
