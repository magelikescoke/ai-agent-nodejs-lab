import { registerAs } from '@nestjs/config';

export interface RagConfiguration {
  chatModel: string;
  embeddingModel: string;
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
}

export const ragConfig = registerAs(
  'rag',
  (): RagConfiguration => ({
    chatModel: process.env.RAG_CHAT_MODEL ?? 'GLM-4.7-Flash',
    embeddingModel: process.env.RAG_EMBEDDING_MODEL ?? 'embedding-3',
    apiKey: process.env.RAG_API_KEY ?? '',
    baseUrl: process.env.RAG_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
    timeoutMs: Number(process.env.RAG_TIMEOUT_MS ?? 30000),
  }),
);
