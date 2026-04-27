# Week 1 Interview Q&A: LLM Structured Output MVP

这份文档用于把 `ai-ticket-classifier` 的 Week 1 MVP 转成面试表达。重点不是背概念，而是能把概念和项目里的工程取舍讲清楚。

## 1. 什么是 structured output？为什么 LLM 应用不能直接相信模型返回的文本？

### 回答框架

Structured output 是让 LLM 按后端预先定义好的数据结构返回结果，比如固定 JSON 字段、字段类型、枚举值和必填规则。它的目标是把模型从“自然语言回复者”约束成“结构化数据生成器”。

LLM 应用不能直接相信模型返回的文本，主要有几个原因：

- 模型输出有概率不稳定，同一个问题可能返回不同字段名、不同语言、Markdown 代码块或额外解释。
- 后端系统需要的是可存储、可查询、可统计、可被下游系统消费的数据，而不是一段自由文本。
- 业务字段通常有明确边界，比如工单分类只能是 `billing / technical / account / complaint / other`，不能让模型自由发明 `payment_issue` 或中文分类名。
- 模型输出本质上是不可信输入，必须像处理外部用户输入一样做服务端校验。

### 结合项目怎么讲

在 `ai-ticket-classifier` 里，我先定义了 `TicketAnalysisSchema`，只允许三个字段：`category`、`overview`、`suggestedAction`。其中 `category` 必须属于固定枚举，另外两个字段必须是非空字符串，并且使用 Zod 的 strict object 拒绝额外字段。

模型调用层使用 OpenAI-compatible 的 `response_format: json_schema`，先从 provider 层约束模型输出 JSON；服务端再用 Zod 做第二层白名单校验。这样做的原因是：provider 的结构化输出能降低错误概率，但不能替代后端校验。真正进入 MongoDB 和缓存的数据，必须通过服务端 schema。

### 面试追问

- JSON Schema 和 Zod 的职责有什么区别？
- 如果模型返回了 JSON，但多了一个字段，系统应该接受还是拒绝？
- structured output 和 function calling / tool calling 有什么关系？

## 2. 如果 LLM 输出不符合 schema，你会怎么处理？

### 回答框架

LLM 输出不符合 schema 时，不能直接把错误结果返回给用户，也不应该无限重试。比较稳妥的处理方式是：

- 先保存原始输出，方便排查到底是模型没按格式返回，还是业务 schema 设计太窄。
- 对解析后的对象做 schema 校验，失败后进行有限 retry。
- retry prompt 要明确告诉模型：上一次输出没有通过 schema 校验，这次只返回符合 schema 的 JSON。
- retry 次数要克制，一般 1 次或 2 次。无限 retry 会放大 token 成本，也会让接口延迟不可控。
- 最终仍失败时，记录错误状态、错误原因、raw output、retryCount、模型名和耗时。

### 结合项目怎么讲

在这个项目里，`TicketService.analyzeTicket()` 调用 `generateValidatedAnalysis()`，最多尝试 2 次，也就是首次调用加 1 次 retry。每次拿到模型输出后，都会用 `TicketAnalysisSchema.safeParse()` 校验。

如果第一次失败，第二次 user prompt 会变成修正型 prompt，明确要求模型“Retry once and return only a JSON object matching the required schema”。如果第二次仍失败，系统会创建一条 `status: error` 的 MongoDB 记录，并保存最后一次 raw output、parsed output、retryCount、modelName 和 latencyMs。

这里的取舍是：MVP 里优先保证可观测和成本可控，而不是追求一定成功。因为如果模型连续两次都不能给出合法结构，继续 retry 很可能是 prompt、模型兼容性或输入分布出了问题，需要靠落库信息复盘。

### 面试追问

- 为什么 retry 次数不能太多？
- retry 时应该复用原 prompt，还是给模型更多错误上下文？
- 如果 JSON.parse 失败和 Zod 校验失败，你会不会分开处理？

## 3. 为什么 AI 工单分类系统要加缓存？缓存 key 怎么设计？

### 回答框架

AI 应用加缓存主要是为了降低成本、降低延迟，并减少对外部模型 provider 的重复调用。尤其是工单分类这种任务，相同内容的输入通常应该得到相同分类结果，没有必要每次都调用 LLM。

缓存 key 的设计要注意：

- 不能直接用原文作为 key，容易太长，也可能包含特殊字符或敏感内容。
- 可以先对内容做标准化处理，比如 trim，再做 SHA-256。
- key 要带业务前缀，避免和其他缓存冲突。
- 缓存需要 TTL，避免长期持有旧模型、旧 prompt 或旧业务规则下的结果。
- 如果后续引入 prompt version、model version，缓存 key 里最好包含这些版本信息，避免升级 prompt 后仍命中旧结果。

### 结合项目怎么讲

项目里对 ticket content 使用 SHA-256 生成哈希，然后拼成 `TicketContentCache:${hash}`。同步分析时会先查 Redis，命中缓存就直接返回结构化结果，并标记 `cacheHit: true`，不再调用 LLM。

缓存 TTL 当前设置为 10 分钟。这个时间不是生产最佳值，而是 Week 1 MVP 的保守选择：既能证明重复请求节省 LLM 调用，又不会让旧结果长期存在。后续进入 Week 2 后，如果加上 `promptVersion` 和 eval，就应该把 `promptVersion`、`modelName` 也纳入缓存 key，避免 prompt 改了但缓存还返回旧策略下的结果。

### 面试追问

- 为什么不能永久缓存 LLM 分类结果？
- 缓存 key 里是否应该包含用户 ID 或租户 ID？
- 缓存命中时还要不要写 MongoDB 记录？

## 4. 幂等在这个系统里怎么体现？和缓存有什么区别？

### 回答框架

缓存和幂等相关，但不是一回事。

缓存关注的是性能和成本：相同输入尽量复用已有结果，减少重复计算或重复调用 LLM。

幂等关注的是副作用控制：同一个请求重复提交时，系统状态不会被重复改变到不可控，比如不会重复创建多条任务、不会重复扣费、不会重复触发下游动作。

在 AI 后端里，幂等尤其重要，因为 LLM 调用可能很慢，客户端可能超时重试，队列任务也可能失败重跑。如果没有幂等设计，同一个工单可能被重复分析、重复入库、重复推送通知。

### 结合项目怎么讲

当前项目里同步接口通过内容 hash 做缓存，体现了弱幂等：同样 content 在 TTL 内会复用结果，不再重复调用 LLM。

批量任务里，每次 `POST /tickets/batch-analyze` 都会生成新的 `batchId`，然后用 `${batchId}-${index}` 作为 BullMQ jobId。这个设计能保证同一个 batch 内的 jobId 稳定，但还不能防止客户端重复提交同一个 batch。也就是说，它满足了“batch 内任务可识别”，还没有完全实现“请求级幂等”。

如果要进一步生产化，我会让客户端传 `Idempotency-Key` 或服务端根据批量内容生成 request hash。然后用这个 key 作为 batch 去重依据：同一个 key 重复提交时，返回已有 batch 和 job 列表，而不是重新入队。

### 面试追问

- BullMQ 的 jobId 可以解决哪些幂等问题，不能解决哪些问题？
- 如果 worker 执行到一半失败重试，怎么避免重复写 MongoDB？
- 同步接口是否应该每次缓存命中都创建新的查询记录？

## 5. 你如何控制 token 成本？

### 回答框架

控制 token 成本要从输入、输出、调用次数和可观测性四个角度做。

输入侧：

- 限制用户输入长度，避免超长文本直接进入 prompt。
- 对输入做必要清洗，只传和任务相关的内容。
- 避免把大量无关上下文塞进 system prompt。

输出侧：

- 输出字段要少而明确，避免让模型生成长篇解释。
- 使用 JSON Schema 限定字段和枚举。
- 对 summary/action 这类字段要求 concise。

调用次数：

- 对相同输入加缓存。
- 校验失败只做有限 retry。
- 批量任务通过队列限流，避免瞬间并发导致大量失败和重复调用。

可观测性：

- 记录模型名、耗时、retryCount、cacheHit。
- 后续可以记录 promptVersion、inputTokens、outputTokens、totalTokens。
- 用 eval 对比不同 prompt 或模型的准确率和成本，而不是只看单次效果。

### 结合项目怎么讲

这个项目已经做了几个基础控制：

- DTO 层限制 `content` 最大 10,000 字符。
- structured output 只包含三个字段，避免模型输出冗长解释。
- temperature 设置为 0.1，减少格式和分类波动。
- 相同 content 命中 Redis 缓存后不再调用 LLM。
- schema 校验失败只 retry 1 次。
- 批量任务通过 BullMQ worker concurrency 和 limiter 控制调用频率。
- MongoDB 记录 `modelName`、`latencyMs`、`retryCount`，为后续成本分析打基础。

还可以继续增强：从 LLM provider 响应里读取 token usage 并落库；把 prompt version 加进记录；跑 eval 时输出准确率、平均 token、平均耗时和缓存命中率。这样面试时就能讲清楚：我不是只会接 API，而是知道 LLM 应用的成本会从哪里失控，以及如何用工程手段控制它。

### 面试追问

- 为什么 structured output 能帮助控制 token 成本？
- retry 会怎样影响成本？你怎么判断 retry 值设多少合适？
- 如果准确率更高的模型贵 3 倍，你会怎么做取舍？

## 练习建议

回答时可以按这个顺序讲：

1. 先解释概念。
2. 再说明为什么这是 LLM 应用后端必须处理的问题。
3. 然后结合 `ai-ticket-classifier` 说具体实现。
4. 最后补一句生产化改进方向。

不要把回答讲成“我用了某某库”。更好的表达是：“我先定义业务边界，然后用 JSON Schema 降低模型输出漂移概率，再用 Zod 做服务端强校验，最后把 raw output、retryCount、modelName 和 latencyMs 落库，方便排查和评测。”
