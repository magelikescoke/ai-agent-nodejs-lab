import { registerAs } from '@nestjs/config';
import { GlmProviderConfig } from '../llm/glm.provider';
import { LLMProviderName } from '../llm/llm.provider-factory';

export interface LlmConfiguration {
  provider: LLMProviderName;
  glm: GlmProviderConfig;
}

export const llmConfig = registerAs(
  'llm',
  (): LlmConfiguration => ({
    provider: (process.env.LLM_PROVIDER ?? 'glm') as LLMProviderName,
    glm: {
      apiKey: process.env.GLM_API_KEY ?? '',
      baseUrl: process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
      model: process.env.GLM_MODEL ?? 'GLM-4.7-Flash',
      timeoutMs: Number(process.env.GLM_TIMEOUT_MS ?? 30000),
    },
  }),
);
