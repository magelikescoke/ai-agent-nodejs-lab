import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { LLMProviderFactory, LLMProviderName, LLMProviderNames } from './llm.provider-factory';
import Bluebird from 'bluebird';
import type { LLMResponseFormat } from './llm.base-provider';

import _ from 'lodash';

const LLM_HEALTH_CACHE_TTL_MS = 60_000;

export interface LLMHealthResult {
  status: 'ok' | 'error';
  provider: LLMProviderName;
  latencyMs: number;
  error?: string;
}

@Injectable()
export class LLMService {
  @Inject()
  private llmFactory: LLMProviderFactory;

  @Inject(CACHE_MANAGER)
  private cacheManager: Cache;

  private getProvider(name: LLMProviderName) {
    return this.llmFactory.getProvider(name);
  }

  public async generateText(prompt: string) {
    const defaultLlm: LLMProviderName = 'glm';
    return this.getProvider(defaultLlm).generateText(prompt);
  }

  public async generateJsonOutput<T>(
    systemPrompt: string,
    userPrompt: string,
    format: LLMResponseFormat,
  ): Promise<T> {
    const defaultLlm: LLMProviderName = 'glm';
    return this.getProvider(defaultLlm).generateJsonOutput<T>(systemPrompt, userPrompt, format);
  }

  public async getHealth(): Promise<Array<LLMHealthResult>> {
    return Bluebird.map(LLMProviderNames, (name) => this.getCachedProviderHealth(name), {
      concurrency: 3,
    });
  }

  private async getCachedProviderHealth(name: LLMProviderName): Promise<LLMHealthResult> {
    const cacheKey = this.getHealthCacheKey(name);
    const cached = await this.cacheManager.get<LLMHealthResult>(cacheKey);

    if (!_.isNil(cached)) {
      return cached;
    }

    const result = await this.checkProviderHealth(name);
    await this.cacheManager.set(cacheKey, result, LLM_HEALTH_CACHE_TTL_MS);

    return result;
  }

  private async checkProviderHealth(name: LLMProviderName): Promise<LLMHealthResult> {
    const provider = this.getProvider(name);
    const startedAt = Date.now();

    try {
      await provider.generateText('Reply with exactly: ok');
      return {
        status: 'ok',
        provider: name,
        latencyMs: Date.now() - startedAt,
      };
    } catch {
      return {
        status: 'error',
        provider: name,
        latencyMs: Date.now() - startedAt,
        error: 'LLM provider request failed',
      };
    }
  }

  private getHealthCacheKey(name: LLMProviderName): string {
    return `health:llm:${name}`;
  }
}
