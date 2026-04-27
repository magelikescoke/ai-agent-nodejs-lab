# LLM 应用为什么必须做结构化输出和评测

LLM 应用后端不能只停留在“把 prompt 发给模型，再把文本返回给用户”。真实业务系统需要的是可存储、可查询、可回归测试、可被下游服务消费的数据。`ai-ticket-classifier` 用客服工单分类这个小场景，验证了一个核心结论：结构化输出和 Eval 是 LLM 应用走向生产化的基础设施。

## 问题：自然语言输出不可控

普通 prompt 很容易出现以下问题：

- 模型输出 Markdown、解释文字或额外字段，后端无法稳定解析。
- 分类字段不在业务枚举内，例如输出 `sales`、`payment` 这类系统不认识的值。
- prompt 稍微变化后，原本能解析的输出突然变成非 JSON。
- 没有评测集时，很难判断 prompt 优化是真的变好，还是只是在单条样例上看起来更好。

在业务链路里，这些问题会直接变成接口不稳定、数据污染和下游消费失败。

## 结构化输出的做法

这个项目用了三层约束：

1. System prompt 明确要求只输出 JSON，并限定允许字段。
2. OpenAI-compatible `response_format` 使用 JSON Schema 限制字段、枚举和 `additionalProperties: false`。
3. 服务端用 Zod strict schema 再校验一次，拒绝 schema 外字段和不支持的枚举。

这种设计把“不信任模型输出”作为默认前提。模型输出即使看起来像 JSON，也必须通过服务端 schema 才能写入成功状态。

## Eval 的作用

Eval 解决的是“改动是否真的提升稳定性”的问题。项目中准备了 20 条覆盖 `billing / technical / account / complaint / other` 的工单样例，并对比两个 prompt version：

| Prompt version | Accuracy | Schema pass | Category match | Priority match | Avg latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ticket-analysis-v1` | 0% (0/20) | 0/20 | 0/20 | 0/20 | 1100ms |
| `ticket-analysis-v2` | 55% (11/20) | 20/20 | 19/20 | 12/20 | 1236ms |

这个结果说明两件事：

- 严格 schema 和 few-shot 明显提升了输出可解析性，schema pass 从 0/20 到 20/20。
- 业务判断仍需要继续优化，特别是 priority 的判断标准还不够稳定。

没有 Eval，这些问题只能靠人工感觉；有了 Eval，就可以把 prompt 迭代变成可比较、可回归的工程流程。

## 异常输出必须 fallback

生产服务不能因为模型返回非法 JSON 就让业务链路崩掉。当前项目的处理方式是：

- LLM 输出校验失败时 retry 1 次。
- 仍失败时写入 `status: "error"` 的分析记录。
- 保存 raw output、parsed output、prompt version、model name、latency 和 retry count，方便排查。
- 不把异常输出当作成功结果返回给下游。

这让系统在模型不稳定时仍然保持可观测、可恢复。

## 结论

LLM 应用的生产化重点不是“能不能调用模型”，而是：

- 输出是否可控。
- 失败是否可观测。
- prompt 改动是否可回归。
- 结果是否能被下游系统稳定消费。

结构化输出解决数据契约问题，Eval 解决质量回归问题。两者结合，才是 LLM 后端从 demo 走向真实业务系统的起点。
