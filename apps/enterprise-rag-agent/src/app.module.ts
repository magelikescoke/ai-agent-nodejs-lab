import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfiguration, appConfig } from './config/app.config';
import { ragConfig } from './config/rag.config';
import { DocumentModule } from './document/document.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RetrievalModule } from './retrieval/retrieval.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/enterprise-rag-agent/.env', '.env'],
      load: [appConfig, ragConfig],
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
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const appConfiguration = configService.getOrThrow<AppConfiguration>('app');

        return {
          connection: getRedisConnectionOptions(appConfiguration.redisUrl),
        };
      },
      inject: [ConfigService],
    }),
    DocumentModule,
    IngestionModule,
    RetrievalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
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
