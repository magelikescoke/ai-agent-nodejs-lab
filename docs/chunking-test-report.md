# Chunking 测试报告

日期：2026-04-29

## 测试范围

本次测试覆盖 `apps/enterprise-rag-agent` 的文本 chunking 策略：

- `TextDocumentSplitterStrategy.supports`
- `TextDocumentSplitterStrategy.split`
- 3 份真实 Markdown 测试文档：
  - `apps/enterprise-rag-agent/test-data/product-faq.md`
  - `apps/enterprise-rag-agent/test-data/technical-guide.md`
  - `apps/enterprise-rag-agent/test-data/operations-runbook.md`

## 测试命令

```bash
npm run test --workspace apps/enterprise-rag-agent -- document-splitter.strategy.spec.ts --runInBand
```

## 自动化测试结果

| Test Suite                                         | Tests | Result |
| -------------------------------------------------- | ----: | ------ |
| `src/ingestion/document-splitter.strategy.spec.ts` |     4 | Pass   |

断言覆盖：

- `.md` 扩展名可被文本 splitter 支持。
- `text/plain` MIME type 可被文本 splitter 支持。
- PDF metadata 不会被文本 splitter 支持。
- 每个样例文档都能切出多个 chunk。
- chunk 的 `documentId`、`chunkIndex`、`metadata.source` 正确。
- `chunkIndex` 从 0 开始连续递增。
- chunk 内容非空。
- chunk 长度不超过当前 `chunkSize: 1000`。
- `tokenCount` 等于当前实现的轻量估算：`ceil(trimmedContentLength / 4)`。

## 样例文档切分结果

| Document                | Source chars | Chunks | Min chars | Max chars | Avg chars | Estimated tokens | Max estimated tokens |
| ----------------------- | -----------: | -----: | --------: | --------: | --------: | ---------------: | -------------------: |
| `product-faq.md`        |         1164 |      2 |       250 |       911 |       581 |              291 |                  228 |
| `technical-guide.md`    |         1423 |      2 |       442 |       978 |       710 |              356 |                  245 |
| `operations-runbook.md` |         1483 |      2 |       486 |       994 |       740 |              371 |                  249 |

## 结论

当前 recursive chunking 策略可以稳定处理 FAQ、技术文档和 runbook 三类 Markdown 文档。三份样例的最大 chunk 长度均小于 1000 字符，chunk metadata 可追溯到源文件，token estimate 可用于后续 embedding 批处理和检索上下文预算。

后续接入真实 embedding 后，建议增加端到端测试，覆盖 chunk 入库、embedding queue job 创建和向量库写入结果。
