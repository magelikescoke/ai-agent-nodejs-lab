import { Inject, Injectable } from '@nestjs/common';
import { GLMProvider } from './glm.provider';
import { LLMBaseProvider } from './llm.base-provider';
import { LLM_PROVIDER_NAME } from './llm.tokens';

export type LLMProviderName = 'glm';

@Injectable()
export class LLMProviderFactory {
  public constructor(
    private readonly glmProvider: GLMProvider,
    @Inject(LLM_PROVIDER_NAME) private readonly defaultProviderName: LLMProviderName,
  ) {}

  public getProvider(name: LLMProviderName = this.defaultProviderName): LLMBaseProvider {
    switch (name) {
      case 'glm':
        return this.glmProvider;
      default:
        name satisfies never;
        throw new Error('Unsupported LLM provider');
    }
  }
}
