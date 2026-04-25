import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import KeyvRedis from '@keyv/redis';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiRacingInterceptor } from './common/http/api-racing.interceptor';
import { AppConfiguration, appConfig } from './config/app.config';
import { llmConfig } from './config/llm.config';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ai-ticket-classifier/.env', '.env'],
      load: [appConfig, llmConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        const appConfiguration = configService.getOrThrow<AppConfiguration>('app');

        return {
          stores: [new KeyvRedis(appConfiguration.redisUrl)],
        };
      },
      inject: [ConfigService],
    }),
    LlmModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiRacingInterceptor,
    },
  ],
})
export class AppModule {}
