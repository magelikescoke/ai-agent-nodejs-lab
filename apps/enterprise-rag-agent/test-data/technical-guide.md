# AcmeDesk Webhook 技术文档

## 概述

Webhook 用于把 AcmeDesk 内部事件推送到企业自有系统，例如 CRM、数据仓库、告警平台或内部审批系统。当前支持工单创建、工单更新、评论新增、成员变更和 SLA 风险事件。所有 Webhook 请求都使用 HTTPS POST，并携带 JSON payload。

## 快速开始

### 创建 Webhook

管理员进入“开发者设置 -> Webhook”，点击“新建 Webhook”，填写目标 URL、事件类型和密钥。目标 URL 必须使用 HTTPS，并且需要在 5 秒内返回 2xx 状态码。创建后可以使用“发送测试事件”验证连通性。

### 事件格式

每个事件都包含 `id`、`type`、`createdAt` 和 `data` 字段。`id` 是事件唯一标识，可用于幂等处理。`type` 表示事件类型，例如 `ticket.created`。`data` 根据事件类型携带具体资源快照。

```json
{
  "id": "evt_01J8Z7F7N9M3A0S4V6Q8H2K1P9",
  "type": "ticket.created",
  "createdAt": "2026-04-29T09:30:00.000Z",
  "data": {
    "ticketId": "tic_123",
    "subject": "Cannot export report",
    "priority": "high"
  }
}
```

## 鉴权与签名

### 签名头

AcmeDesk 会在请求头中附加 `X-AcmeDesk-Signature` 和 `X-AcmeDesk-Timestamp`。签名算法为 HMAC-SHA256，签名内容是 `timestamp + "." + rawBody`。服务端应使用配置的 Webhook 密钥重新计算签名，并使用常量时间比较避免时序攻击。

### 重放保护

接收方应校验 `X-AcmeDesk-Timestamp` 与当前时间的差值。建议接受 5 分钟以内的请求，超过窗口的请求应拒绝。对于已经处理过的事件 `id`，接收方应直接返回成功，避免重复写入下游系统。

## 重试策略

如果目标服务返回非 2xx 状态码、连接超时或 TLS 握手失败，AcmeDesk 会重试投递。默认最多重试 8 次，退避间隔从 1 分钟开始逐步增加。超过最大次数后，事件会进入失败列表，管理员可以手动重新投递。

## 速率限制

单个组织默认每分钟最多投递 600 个事件。如果事件量超过限制，系统会排队发送并保持事件顺序。高峰期建议接收方快速写入消息队列，再由内部 worker 处理业务逻辑。

## 错误处理建议

接收方应区分可重试错误和永久错误。数据库临时不可用、下游队列限流属于可重试错误，可以返回 500。payload 校验失败、资源不存在或签名无效属于永久错误，应返回 400 或 401，并记录审计日志。

## 版本兼容

Webhook payload 使用向后兼容策略。新增字段不会提前通知，接收方应忽略未知字段。删除字段或修改字段含义会通过新版本事件类型发布，例如 `ticket.created.v2`。旧版本至少保留 12 个月。
