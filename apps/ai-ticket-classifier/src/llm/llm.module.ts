import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmConfiguration } from '../config/llm.config';
import { GLMProvider, GlmProviderConfig } from './glm.provider';
import { LLMProviderFactory } from './llm.provider-factory';
import { GLM_PROVIDER_CONFIG } from './llm.tokens';

@Module({
  providers: [
    {
      provide: GLM_PROVIDER_CONFIG,
      useFactory: (configService: ConfigService): GlmProviderConfig =>
        configService.getOrThrow<LlmConfiguration>('llm').providers.glm,
      inject: [ConfigService],
    },
    GLMProvider,
    LLMProviderFactory,
  ],
  exports: [LLMProviderFactory],
})
export class LlmModule {}
