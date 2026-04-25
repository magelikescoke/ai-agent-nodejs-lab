import { Injectable } from '@nestjs/common';
import { GLMProvider } from './glm.provider';
import { LLMBaseProvider } from './llm.base-provider';

export const LLMProviderNames = ['glm'] as const;
export type LLMProviderName = (typeof LLMProviderNames)[number];

@Injectable()
export class LLMProviderFactory {
  public constructor(private readonly glmProvider: GLMProvider) {}

  public getProvider(name: LLMProviderName): LLMBaseProvider {
    switch (name) {
      case 'glm':
        return this.glmProvider;
      default:
        name satisfies never;
        throw new Error('Unsupported LLM provider');
    }
  }
}
