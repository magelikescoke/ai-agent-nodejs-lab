import { Inject } from '@nestjs/common';
import {
  OpenAiCompatibleProvider,
  OpenAiCompatibleProviderConfig,
} from './openai-compatible.provider';
import { GLM_PROVIDER_CONFIG } from './llm.tokens';

export type GlmProviderConfig = OpenAiCompatibleProviderConfig;

export class GLMProvider extends OpenAiCompatibleProvider {
  public constructor(@Inject(GLM_PROVIDER_CONFIG) config: GlmProviderConfig) {
    super(config);
  }

  public getDefaultModelName(): string {
    return this.config.model;
  }
}
