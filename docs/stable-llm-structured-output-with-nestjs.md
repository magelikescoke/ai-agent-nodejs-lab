# 我如何用 NestJS 做稳定的 LLM 结构化输出

LLM 应用后端不能只停留在“把 prompt 发给模型，再把文本返回给用户”。真实业务系统需要的是可存储、可查询、可回归测试、可被下游服务消费的数据。`ai-ticket-classifier` 这个项目选择从客服工单分类切入，目标是把一段非结构化工单文本转成稳定 JSON。

## 先定义业务边界

第一步不是写 prompt，而是定义输出 schema。工单分类系统只允许模型返回固定类别：

```text
billing / technical / account / complaint / other
```

这一步很重要。如果完全让模型自由发挥，它可能返回 `payment`、`invoice_issue`、`收费问题` 等多个语义相近但格式不同的结果。后端很难做统计、缓存、自动分派和评测。

项目里的结构化输出只保留三个核心字段：

```json
{
  "category": "billing",
  "overview": "Customer reports a duplicate charge.",
  "suggestedAction": "Check invoice history and refund if confirmed."
}
```

字段少一点，系统更容易稳定。后续如果要支持优先级、分派团队、风险标签，可以基于评测结果再扩展。

## 用 JSON Schema 约束模型输出

项目通过 OpenAI-compatible Chat Completions 的 `response_format: json_schema` 告诉模型必须输出 JSON，并限制字段、必填项和 enum。这样可以减少模型输出自然语言解释、Markdown 代码块、额外字段的概率。

但 provider 约束不能替代服务端校验。模型输出仍然应该被当成不可信输入处理。

## 用 Zod 做服务端白名单校验

服务端使用 Zod 定义 `TicketAnalysisSchema`，并开启 strict object。这样可以保证：

- `category` 必须属于固定枚举。
- `overview` 和 `suggestedAction` 必须是非空字符串。
- 输出不能包含 schema 外字段。

这层校验是 LLM 应用进入工程化的关键。只有通过校验的数据才进入业务记录和缓存。

## 校验失败要 retry，但不要无限 retry

项目里校验失败后只 retry 1 次。第一次输出不合法时，第二次 prompt 会明确告诉模型“上一次输出没有通过 schema 校验，请只返回符合 schema 的 JSON”。

retry 次数需要克制。无限 retry 会放大成本，也会让请求延迟不可控。对一个客服工单分类服务来说，1 次 retry 已经能覆盖很多格式抖动，失败后记录错误更可控。

## 原始输出和解析结果都要落库

每次分析会保存：

- 请求内容
- 模型原始输出
- 解析后的结构化输出
- 模型名
- 耗时
- retry 次数
- 处理状态
- 错误信息

这不是为了“多存点日志”，而是为了后续排查和评测。LLM 应用的问题经常不是代码异常，而是 prompt、模型版本、输入分布变化导致的输出漂移。没有原始输出，很难复盘。

## 缓存和队列要分层处理

同步接口会先检查 Redis 缓存。相同工单内容命中缓存时，不再调用 LLM，直接返回之前的分析结果。

批量任务走 BullMQ。API 层只负责接收请求和入队，Worker 层控制 LLM 调用并发和频率。这样可以避免 20 条、200 条工单同时打到模型 provider。

这两层分别解决不同问题：

- Redis 缓存控制重复调用成本。
- BullMQ 控制后台任务的并发、重试和失败记录。

## 评测样例是后续演进的基础

项目准备了 20 条测试工单样例，覆盖 `billing / technical / account / complaint / other`。这些样例后续会变成 eval 集，用来比较不同 prompt version 或模型配置的分类准确率。

没有 eval 的 prompt 调整，本质上是凭感觉改。结构化输出项目必须尽早准备样例集，否则每次优化都无法判断是否引入回归。

## 小结

一个稳定的 LLM 结构化输出后端，核心不是“prompt 写得更聪明”，而是把模型放进明确的工程边界里：

- 输出 schema 先由业务定义。
- 模型输出必须被 JSON Schema 和 Zod 双重约束。
- 校验失败要有限 retry。
- 原始输出、解析结果和错误都要落库。
- 缓存控制成本，队列控制并发。
- eval 样例为后续 prompt 演进提供回归基线。

这也是 `ai-ticket-classifier` 的 Week 1 MVP 目标：不是做一个复杂客服系统，而是做一个能稳定处理 LLM 结构化输出的 AI 后端基础项目。
