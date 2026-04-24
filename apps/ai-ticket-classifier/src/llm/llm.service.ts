import { Inject, Injectable } from '@nestjs/common';
import { LLMProviderFactory, LLMProviderName } from './llm.provider-factory';

@Injectable()
export class LLMService {
  @Inject()
  private llmFactory: LLMProviderFactory;

  private getProvider(name: LLMProviderName) {
    return this.llmFactory.getProvider(name);
  }

  public async generateText(prompt: string) {
    const defaultLlm: LLMProviderName = 'glm';
    return this.getProvider(defaultLlm).generateText(prompt);
  }
}
