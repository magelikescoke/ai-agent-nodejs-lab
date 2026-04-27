# Backlog

## Ticket Classifier

- 增加请求级幂等：支持 `Idempotency-Key` 或请求 hash，避免重复 batch 产生重复 job。
- 拆分 API 和 worker 部署：生产环境下分别扩缩容 HTTP 服务和 BullMQ worker。
- 增加认证与租户隔离：为 ticket analysis、job 查询和缓存 key 加 tenant 维度。
- 增加敏感信息脱敏：对邮箱、手机号、token、密钥等内容做入库前脱敏策略。
- 增加结构化日志和 traceId：贯穿 HTTP、LLM 调用、BullMQ job、MongoDB 记录。
- 增加 LLM 成本统计：记录 token usage、provider、模型价格和单次请求成本。
- 增加 provider fallback：主 LLM provider 失败时降级到备用 provider 或返回可解释错误。
- 增加 dead-letter queue：对多次失败的 batch job 做隔离和人工排查。
- 扩充 Eval 数据集：增加 prompt injection、边界优先级、混合意图和多语言 case。
- 优化 priority rubric：当前 eval 显示 priority match 仍不稳定，需要更细的判断规则。

## Week 3 RAG

- 初始化 `apps/enterprise-rag-agent`。
- 选择向量库：Qdrant 或 PostgreSQL + pgvector。
- 设计文档上传、ingestion、retrieval、chat API。
- 增加 RAG Eval：retrieval hit rate、citation accuracy、拒答准确率和延迟。
