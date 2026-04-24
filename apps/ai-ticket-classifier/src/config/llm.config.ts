import { registerAs } from '@nestjs/config';

export interface LlmConfiguration {
  providers: {
    glm: {
      apiKey: string;
      baseUrl: string;
      model: string;
      timeoutMs: number;
    };
  };
}

export const llmConfig = registerAs(
  'llm',
  (): LlmConfiguration => ({
    providers: {
      glm: {
        apiKey: process.env.GLM_API_KEY ?? '',
        baseUrl: process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
        model: process.env.GLM_MODEL ?? 'GLM-4.7-Flash',
        timeoutMs: Number(process.env.GLM_TIMEOUT_MS ?? 30000),
      },
    },
  }),
);
