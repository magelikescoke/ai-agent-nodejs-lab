# AcmeDesk 工单延迟升高 Runbook

## 背景

当客户反馈工单列表加载缓慢，或者监控发现 `ticket_api_p95_latency_ms` 连续 5 分钟超过 1500ms 时，需要执行本 runbook。目标是在 15 分钟内判断问题位于 API、MongoDB、Redis、队列 worker 还是第三方依赖，并给出缓解动作。

## 触发条件

### 告警名称

`TicketApiHighLatency`：API p95 延迟超过 1500ms，持续 5 分钟。

`TicketQueueBacklogHigh`：工单分析队列等待任务超过 1000 个，持续 10 分钟。

`MongoPrimaryCpuHigh`：MongoDB primary CPU 超过 85%，持续 10 分钟。

### 影响范围

可能影响工单列表、工单详情、批量分析、SLA 报表刷新和自动分派规则执行。只读接口变慢通常说明数据库或缓存压力较高；写接口变慢通常需要检查 MongoDB primary、Redis 和 BullMQ worker。

## 快速诊断

### 1. 检查 API 健康状态

运行：

```bash
curl http://localhost:3001/health
```

如果健康检查失败，先查看应用日志和容器状态。确认最近是否有部署、配置变更或依赖升级。如果只有少量实例异常，可以先摘除异常实例并保留日志。

### 2. 检查 MongoDB

查看 primary CPU、连接数、慢查询和锁等待。重点关注 `ticket_analyses`、`rag_documents` 和 `rag_chunks` 集合是否出现全集合扫描。如果慢查询集中在某个新接口，记录 query shape 并确认是否缺少索引。

### 3. 检查 Redis 和 BullMQ

查看 Redis 内存、连接数、evicted keys 和队列等待数量。如果队列积压但 API 正常，优先扩容 worker。如果 Redis 内存接近上限，临时降低缓存 TTL，并确认是否有异常大 key。

### 4. 检查第三方 LLM

如果延迟只出现在分析或向量化任务，检查 LLM provider 的错误率、超时和限流响应。当前 embedding 仍为 mock 阶段，真实向量化接入前应只看到 mock worker 的处理日志。

## 缓解动作

### API 压力过高

临时提高 API 副本数，并开启更严格的 rate limit。对于报表类接口，可以短时间延长缓存 TTL。避免在高峰期执行批量导出和全量 reindex。

### MongoDB 压力过高

先确认是否存在长事务或异常慢查询。必要时临时关闭低优先级后台任务，例如历史数据导出和批量重算。不要直接删除索引或重启 primary，除非已经确认有明确维护窗口。

### 队列积压

增加 worker 并发前先确认下游依赖没有限流。如果下游 LLM 返回 429，应降低并发并延长退避时间。对于 mock embedding 阶段，可以安全重试失败任务，但需要保留失败样本用于后续真实 embedding 接入验证。

## 事后复盘

复盘需要记录告警时间、影响客户、根因、缓解动作、恢复时间和后续改进项。如果新增了索引、限流规则或 worker 配置，需要同步更新本 runbook。所有临时开关必须在恢复后确认是否回滚。
