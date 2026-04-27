import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import KeyvRedis from '@keyv/redis';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiRateLimitGuard } from './common/http/api-rate-limit.guard';
import { ApiRacingInterceptor } from './common/http/api-racing.interceptor';
import { AppConfiguration, appConfig } from './config/app.config';
import { llmConfig } from './config/llm.config';
import { LlmModule } from './llm/llm.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ai-ticket-classifier/.env', '.env'],
      load: [appConfig, llmConfig],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const appConfiguration = configService.getOrThrow<AppConfiguration>('app');

        return {
          uri: appConfiguration.mongodbUri,
        };
      },
      inject: [ConfigService],
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
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const appConfiguration = configService.getOrThrow<AppConfiguration>('app');

        return {
          connection: getRedisConnectionOptions(appConfiguration.redisUrl),
        };
      },
      inject: [ConfigService],
    }),
    LlmModule,
    TicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiRacingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ApiRateLimitGuard,
    },
  ],
})
export class AppModule {}

function getRedisConnectionOptions(redisUrl: string) {
  const url = new URL(redisUrl);
  const dbPath = url.pathname.replace('/', '');

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: dbPath ? Number(dbPath) : undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}
